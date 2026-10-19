using System;
using System.IO;
using System.Text;
using UnityEngine;
namespace LegendHeroes
{
    public static class PrintService
    {
        static string Escape(string text)=>System.Net.WebUtility.HtmlEncode(text??"");
        public static string CreateHtml(PlayerSave s,PrintSheet sheet)
        {
            var html=new StringBuilder("<!doctype html><html lang='ja'><meta charset='utf-8'><title>"+Escape(sheet.name)+"</title><style>@page{size:A4;margin:15mm}body{font-family:serif;color:#111}h1{font-size:23px}header{border-bottom:2px solid;padding-bottom:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 25px}.question{height:102px;border-bottom:1px solid #aaa;break-inside:avoid;font-size:22px}.answer{height:40px;border:1px solid #777;margin:8px 0}.code{margin-top:20px;border:2px solid;padding:10px}button{padding:12px;font-size:18px}@media print{button{display:none}}details{margin-top:20px}@media print{details{display:none}}</style><header><h1>"+Escape(sheet.name)+"</h1><p>名前："+Escape(s.playerName)+"　日付：　　　年　　月　　日</p></header>");
            if(sheet.challenge)html.Append("<p><b>報酬3倍！ 正答率80%以上で装備10連ガチャチケット×1</b></p>");html.Append("<div class='grid'>");for(int i=0;i<sheet.problems.Length;i++){var q=sheet.problems[i];bool writing=sheet.mode=="kaki"||sheet.mode=="mix"&&i%2==1;html.Append("<section class='question'>("+(i+1)+") "+Escape(writing&&q.language?q.answer:q.text)+(q.language?writing?" を漢字で":" のよみ":" =")+"<div class='answer'></div></section>");}html.Append("</div><div class='code'>プリント番号："+sheet.id+"　暗号："+sheet.code+"<br>ゲームの「プリントを採点」で番号と暗号を入力してください。</div><button onclick='window.print()'>印刷 / PDFに保存</button><details><summary>保護者用・答え</summary>");for(int i=0;i<sheet.problems.Length;i++){var q=sheet.problems[i];bool writing=sheet.mode=="kaki"||sheet.mode=="mix"&&i%2==1;html.Append("<p>"+(i+1)+"："+Escape(writing&&q.language?q.text:q.answer)+(q.remainder>=0?" あまり "+q.remainder:"")+"</p>");}html.Append("</details></html>");return html.ToString();
        }
        public static string Write(PlayerSave save,PrintSheet sheet)
        {string folder=Path.Combine(Path.GetDirectoryName(LocalSave.PathName),"prints");Directory.CreateDirectory(folder);string path=Path.Combine(folder,sheet.id+".html");File.WriteAllText(path,CreateHtml(save,sheet),Encoding.UTF8);return path;}
    }
}
