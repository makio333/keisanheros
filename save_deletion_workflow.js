// Keep account/entitlement state outside the per-save deletion workflow.
export function createSaveDeletionWorkflow({confirm,deleteRemote,deleteLocal,onResult=()=>{},setBusy=()=>{}}){
  if(typeof confirm!=='function'||typeof deleteRemote!=='function'||typeof deleteLocal!=='function')throw Error('invalid_save_deletion_workflow');
  let busy=false;
  return async function deleteSelected(keys){
    if(busy)return {ignored:true,deleted:[],failed:[]};
    const selected=[...new Set((Array.isArray(keys)?keys:[]).filter(key=>typeof key==='string'&&key.length>0))];
    if(!selected.length)return {empty:true,deleted:[],failed:[]};
    busy=true;setBusy(true);
    try{
      if(!await confirm(selected)){
        const result={cancelled:true,deleted:[],failed:[]};
        await onResult(result);return result;
      }
      const deleted=[],failed=[];
      for(const key of selected){
        try{
          await deleteRemote(key);
          await deleteLocal(key);
          deleted.push(key);
        }catch(error){failed.push({key,error});}
      }
      const result={cancelled:false,deleted,failed};
      await onResult(result);return result;
    }finally{busy=false;setBusy(false);}
  };
}
