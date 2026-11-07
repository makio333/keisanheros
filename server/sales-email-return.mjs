const RETURNS=new Set(['/','/?purchase=resume']);
export function salesEmailReturnPath(value='/'){
  if(!RETURNS.has(value))throw Error('unsafe_email_return');
  return value;
}
