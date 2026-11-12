const allowedProjects=new Set(['ailandgames','legend-heroes-raid-fixture']);

export function applicationDefault(){return Object.freeze({syntheticFixtureOnly:true});}

export function initializeApp(options={},name=''){
  if(options.credential?.syntheticFixtureOnly!==true||!allowedProjects.has(options.projectId))throw Error('Synthetic Firebase fixture rejected an unexpected project or credential.');
  return Object.freeze({projectId:options.projectId,name,syntheticFixtureOnly:true});
}

export function getFirestore(app){
  if(app?.syntheticFixtureOnly!==true||!allowedProjects.has(app.projectId))throw Error('Synthetic Firestore fixture rejected an unexpected app.');
  const makeCollection=name=>{
    const ref={
      name,
      doc(id='synthetic-document'){
        return {id,path:`${name}/${id}`,async get(){return {id,exists:false,data:()=>undefined,metadata:{fromCache:false}};}};
      },
      where(){return this;},orderBy(){return this;},limit(){return this;},
      async get(){return {docs:[],forEach(callback){for(const doc of this.docs)callback(doc);}};},
    };
    return ref;
  };
  return Object.freeze({
    projectId:app.projectId,
    collection:makeCollection,
    async runTransaction(){throw Error('Synthetic raid startup smoke forbids Firestore writes.');},
  });
}

export function getAuth(app){
  if(app?.syntheticFixtureOnly!==true||app.projectId!=='ailandgames')throw Error('Synthetic Auth fixture rejected an unexpected app.');
  return Object.freeze({
    async verifyIdToken(token,checkRevoked){
      if(token!=='synthetic-only-token'||checkRevoked!==true)throw Object.assign(Error('Synthetic token rejected.'),{code:'auth/invalid-id-token'});
      return {uid:'synthetic-smoke-user',aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',firebase:{sign_in_provider:'google.com'}};
    },
  });
}
