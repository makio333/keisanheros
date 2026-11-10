// Fill the printable height while retaining the two columns and their source order.
export const regularMathPrintCss=`
body:has(>.p-cols){box-sizing:border-box;height:280mm;margin:0;display:flex;flex-direction:column}
body:has(>.p-cols)>.p-cols{flex:1;min-height:0;grid-template-rows:minmax(0,1fr)}
body:has(>.p-cols)>.p-cols>.p-col{display:flex;flex-direction:column;min-height:0}
body:has(>.p-cols)>.p-cols>.p-col>.p-row{flex:1;min-height:min-content;box-sizing:border-box;border-bottom:0}
`;
