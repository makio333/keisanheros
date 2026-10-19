#import <AppKit/AppKit.h>
#import <WebKit/WebKit.h>

// The game's HTML/CSS/JS is shared with the Web edition. This plugin only hosts
// WebKit and supplies the operating-system facilities normally supplied by a browser.
static WKWebView *gameView;
static NSWindow *previewWindow;
static NSString *gameOrigin;
static NSMutableArray<NSWindow *> *popupWindows;
static NSHashTable<WKWebView *> *printingViews;
static BOOL verificationMode;

@interface LHWebDelegate : NSObject <WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, WKDownloadDelegate>
@end
static LHWebDelegate *webDelegate;
static void OnMain(dispatch_block_t block) { if ([NSThread isMainThread]) block(); else dispatch_async(dispatch_get_main_queue(), block); }
static void SaveResult(NSString *path, id result, NSError *error) {
    NSDictionary *payload = @{ @"result":result ?: [NSNull null], @"error":error.localizedDescription ?: @"" };
    NSData *data = [NSJSONSerialization dataWithJSONObject:payload options:NSJSONWritingPrettyPrinted error:nil];
    [data writeToFile:path atomically:YES];
}
static WKWebViewConfiguration *Configuration(void) {
    WKWebViewConfiguration *config = [WKWebViewConfiguration new];
    config.websiteDataStore = verificationMode ? WKWebsiteDataStore.nonPersistentDataStore : WKWebsiteDataStore.defaultDataStore;
    config.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
    config.preferences.javaScriptCanOpenWindowsAutomatically = YES;
    [config.userContentController addScriptMessageHandler:webDelegate name:@"legendHost"];
    NSString *js = @"window.print=()=>window.webkit.messageHandlers.legendHost.postMessage({type:'print'});";
    [config.userContentController addUserScript:[[WKUserScript alloc] initWithSource:js injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
    return config;
}
static void ConfigureView(WKWebView *view) {
    view.navigationDelegate = webDelegate; view.UIDelegate = webDelegate;
    view.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    view.allowsBackForwardNavigationGestures = NO;
}
@implementation LHWebDelegate
- (void)userContentController:(WKUserContentController *)controller didReceiveScriptMessage:(WKScriptMessage *)message {
    if (![message.body isKindOfClass:NSDictionary.class] || ![message.body[@"type"] isEqual:@"print"]) return;
    WKWebView *view = message.webView;
    if (!view || [printingViews containsObject:view]) return;
    [printingViews addObject:view];
    if (verificationMode) {
        [view evaluateJavaScript:@"JSON.stringify({title:document.title,rows:document.querySelectorAll('.p-row,.p-item').length,text:document.body.innerText.slice(0,250)})" completionHandler:^(id result,NSError *error){
            if([result isKindOfClass:NSString.class]) [gameView evaluateJavaScript:[@"window.__lhNativePrintProbe=" stringByAppendingString:result] completionHandler:nil];
        }];
        return; // Isolated QA never opens a print dialog or submits a print job.
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        NSPrintInfo *info = [NSPrintInfo.sharedPrintInfo copy];
        NSPrintOperation *operation = [view printOperationWithPrintInfo:info];
        operation.showsPrintPanel = YES; operation.showsProgressPanel = YES;
        [operation runOperationModalForWindow:view.window delegate:nil didRunSelector:NULL contextInfo:NULL];
        // Web calls print both on load and after 500ms. Do not open two panels.
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 2*NSEC_PER_SEC), dispatch_get_main_queue(), ^{[printingViews removeObject:view];});
    });
}
- (WKWebView *)webView:(WKWebView *)webView createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration forNavigationAction:(WKNavigationAction *)action windowFeatures:(WKWindowFeatures *)features {
    NSURL *url = action.request.URL;
    if (url && ![url.scheme isEqual:@"about"] && ![url.absoluteString hasPrefix:gameOrigin]) {
        if ([url.scheme isEqual:@"https"] || [url.scheme isEqual:@"http"]) [NSWorkspace.sharedWorkspace openURL:url];
        return nil;
    }
    NSWindow *window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0,0,800,900) styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable|NSWindowStyleMaskResizable backing:NSBackingStoreBuffered defer:NO];
    window.releasedWhenClosed = NO; window.title = @"レジェンドヒーローズ — プリント";
    WKWebView *child = [[WKWebView alloc] initWithFrame:window.contentView.bounds configuration:configuration];
    ConfigureView(child); window.contentView = child; [window center]; [window makeKeyAndOrderFront:nil];
    [popupWindows addObject:window]; return child;
}
- (void)webViewDidClose:(WKWebView *)webView { for (NSWindow *window in [popupWindows copy]) if (window.contentView == webView) { [window close]; [popupWindows removeObject:window]; } }
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)action decisionHandler:(void (^)(WKNavigationActionPolicy))handler {
    NSURL *url=action.request.URL;
    if(action.shouldPerformDownload) { handler(WKNavigationActionPolicyDownload); return; }
    if(!action.targetFrame.isMainFrame || [url.scheme isEqual:@"about"] || [url.scheme isEqual:@"blob"] || [url.absoluteString hasPrefix:gameOrigin]) { handler(WKNavigationActionPolicyAllow); return; }
    if(action.navigationType==WKNavigationTypeLinkActivated && ([url.scheme isEqual:@"https"]||[url.scheme isEqual:@"http"])) [NSWorkspace.sharedWorkspace openURL:url];
    handler(WKNavigationActionPolicyCancel);
}
- (void)webView:(WKWebView *)webView decidePolicyForNavigationResponse:(WKNavigationResponse *)response decisionHandler:(void (^)(WKNavigationResponsePolicy))handler { handler(response.canShowMIMEType ? WKNavigationResponsePolicyAllow : WKNavigationResponsePolicyDownload); }
- (void)webView:(WKWebView *)webView navigationAction:(WKNavigationAction *)action didBecomeDownload:(WKDownload *)download { download.delegate=self; }
- (void)webView:(WKWebView *)webView navigationResponse:(WKNavigationResponse *)response didBecomeDownload:(WKDownload *)download { download.delegate=self; }
- (void)download:(WKDownload *)download decideDestinationUsingResponse:(NSURLResponse *)response suggestedFilename:(NSString *)filename completionHandler:(void (^)(NSURL *))handler {
    NSSavePanel *panel=NSSavePanel.savePanel;panel.nameFieldStringValue=filename;
    [panel beginWithCompletionHandler:^(NSModalResponse result){handler(result==NSModalResponseOK?panel.URL:nil);}];
}
- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))handler { NSAlert *alert=[NSAlert new];alert.messageText=message;[alert addButtonWithTitle:@"OK"];[alert runModal];handler(); }
- (void)webView:(WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(BOOL))handler { NSAlert *alert=[NSAlert new];alert.messageText=message;[alert addButtonWithTitle:@"OK"];[alert addButtonWithTitle:@"キャンセル"];handler([alert runModal]==NSAlertFirstButtonReturn); }
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString *))handler { NSAlert *alert=[NSAlert new];alert.messageText=prompt;NSTextField *input=[[NSTextField alloc] initWithFrame:NSMakeRect(0,0,300,28)];input.stringValue=defaultText?:@"";alert.accessoryView=input;[alert addButtonWithTitle:@"OK"];[alert addButtonWithTitle:@"キャンセル"];handler([alert runModal]==NSAlertFirstButtonReturn?input.stringValue:nil); }
- (void)webView:(WKWebView *)webView runOpenPanelWithParameters:(WKOpenPanelParameters *)parameters initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSArray<NSURL *> *))handler { NSOpenPanel *panel=NSOpenPanel.openPanel;panel.allowsMultipleSelection=parameters.allowsMultipleSelection;panel.canChooseDirectories=parameters.allowsDirectories;[panel beginWithCompletionHandler:^(NSModalResponse result){handler(result==NSModalResponseOK?panel.URLs:nil);}]; }
- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error { NSLog(@"Legend Heroes: %@",error.localizedDescription); }
@end
extern "C" {
__attribute__((visibility("default"))) void LHWebOpen(const char *url, int editor) {
    NSString *address=[NSString stringWithUTF8String:url];
    OnMain(^{
        if(gameView) return;
        verificationMode=editor==2;
        NSURL *location=[NSURL URLWithString:address];gameOrigin=[NSString stringWithFormat:@"%@://%@:%@/",location.scheme,location.host,location.port];
        webDelegate=[LHWebDelegate new];popupWindows=[NSMutableArray new];printingViews=[NSHashTable weakObjectsHashTable];
        NSWindow *window;
        if(editor) { previewWindow=[[NSWindow alloc] initWithContentRect:NSMakeRect(0,0,1366,900) styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable|NSWindowStyleMaskResizable backing:NSBackingStoreBuffered defer:NO];previewWindow.releasedWhenClosed=NO;previewWindow.title=@"レジェンドヒーローズ — Web版と共通のUI";[previewWindow center];window=previewWindow; }
        else { window=NSApp.mainWindow; if(!window) for(NSWindow *candidate in NSApp.windows) if(candidate.visible && ![candidate isKindOfClass:NSPanel.class]) {window=candidate;break;} }
        if(!window) {NSLog(@"Legend Heroes: no game window");return;}
        gameView=[[WKWebView alloc] initWithFrame:window.contentView.bounds configuration:Configuration()];ConfigureView(gameView);
        [window.contentView addSubview:gameView];[window makeKeyAndOrderFront:nil];[window makeFirstResponder:gameView];
        [gameView loadRequest:[NSURLRequest requestWithURL:location]];
    });
}
__attribute__((visibility("default"))) void LHWebClose(void) { OnMain(^{[gameView stopLoading];[gameView removeFromSuperview];gameView=nil;for(NSWindow *window in popupWindows)[window close];[popupWindows removeAllObjects];[previewWindow close];previewWindow=nil;}); }
// Used by the isolated Editor verification harness, never exposed over HTTP.
__attribute__((visibility("default"))) void LHWebEvaluate(const char *script,const char *output) { NSString *js=[NSString stringWithUTF8String:script],*path=[NSString stringWithUTF8String:output];OnMain(^{[gameView evaluateJavaScript:js completionHandler:^(id result,NSError *error){SaveResult(path,result,error);}];}); }
__attribute__((visibility("default"))) void LHWebSnapshot(const char *output) { NSString *path=[NSString stringWithUTF8String:output];OnMain(^{[gameView takeSnapshotWithConfiguration:nil completionHandler:^(NSImage *image,NSError *error){if(!image)return;NSBitmapImageRep *bitmap=[[NSBitmapImageRep alloc] initWithData:image.TIFFRepresentation];[[bitmap representationUsingType:NSBitmapImageFileTypePNG properties:@{}] writeToFile:path atomically:YES];}];}); }
}
