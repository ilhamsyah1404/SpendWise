// pb_migrations/1700000000_init_spendwise.js
// Migrasi awal SpendWise — buat semua collections + extend users

migrate((app) => {

  // ── Extend users ──────────────────────────────────────────────
  const usersCol = app.findCollectionByNameOrId("users");

  const newFields = [
    { id:"field_balance",       name:"balance",        type:"number", options:{min:null,max:null} },
    { id:"field_daily_budget",  name:"daily_budget",   type:"number", options:{min:0,max:null} },
    { id:"field_goals_json",    name:"goals_json",     type:"text",   options:{max:100000} },
    { id:"field_recurring_json",name:"recurring_json", type:"text",   options:{max:100000} },
  ];

  newFields.forEach(f => {
    usersCol.fields.addAt(usersCol.fields.length(), new Field({
      id: f.id, name: f.name, type: f.type,
      required: false, options: f.options,
    }));
  });
  app.save(usersCol);

  // ── transactions ──────────────────────────────────────────────
  const txCol = new Collection({
    name:      "transactions",
    type:      "base",
    listRule:  "@request.auth.id != '' && user = @request.auth.id",
    viewRule:  "@request.auth.id != '' && user = @request.auth.id",
    createRule:"@request.auth.id != ''",
    updateRule:"@request.auth.id != '' && user = @request.auth.id",
    deleteRule:"@request.auth.id != '' && user = @request.auth.id",
    fields: [
      { id:"f_user",   name:"user",    type:"relation", required:true,
        options:{ collectionId:"_pb_users_auth_", cascadeDelete:true, maxSelect:1 } },
      { id:"f_type",   name:"type",    type:"select",   required:true,
        options:{ maxSelect:1, values:["in","out"] } },
      { id:"f_amt",    name:"amt",     type:"number",   required:true,  options:{min:0} },
      { id:"f_note",   name:"note",    type:"text",     required:false, options:{max:200} },
      { id:"f_cat",    name:"cat",     type:"text",     required:false, options:{max:50} },
      { id:"f_src",    name:"src",     type:"text",     required:false, options:{max:50} },
      { id:"f_method", name:"method",  type:"text",     required:false, options:{max:50} },
      { id:"f_txdate", name:"tx_date", type:"date",     required:true },
    ],
  });
  app.save(txCol);

  // ── budgets ───────────────────────────────────────────────────
  const budgetCol = new Collection({
    name:      "budgets",
    type:      "base",
    listRule:  "@request.auth.id != '' && user = @request.auth.id",
    viewRule:  "@request.auth.id != '' && user = @request.auth.id",
    createRule:"@request.auth.id != ''",
    updateRule:"@request.auth.id != '' && user = @request.auth.id",
    deleteRule:"@request.auth.id != '' && user = @request.auth.id",
    fields: [
      { id:"f_buser",  name:"user",   type:"relation", required:true,
        options:{ collectionId:"_pb_users_auth_", cascadeDelete:true, maxSelect:1 } },
      { id:"f_catid",  name:"cat_id", type:"text",     required:true,  options:{max:50} },
      { id:"f_amount", name:"amount", type:"number",   required:true,  options:{min:0} },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_budget_user_cat ON budgets (user, cat_id)",
    ],
  });
  app.save(budgetCol);

}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("budgets"));      } catch(e){}
  try { app.delete(app.findCollectionByNameOrId("transactions")); } catch(e){}
});