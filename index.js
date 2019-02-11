const sql = require("mysql");
const inq = require("inquirer");
const time = require("moment");
const pad = require('pad/lib/es5')
var columnify = require('columnify')
const conOpts = {
     host: "localhost",
     port: "3306",
     user: "root",
     password: "Password1",
     database: "bamazon"
};
let con = sql.createConnection(conOpts);


/***** SHOPPING SECTION *****/
let getProduct = function (arg) {
     let items = [];
     let curItem = {};
     let prodID = arg;
     con = sql.createConnection(conOpts);
     con.connect(function (err) {
          if (err) throw err;
     });
     //GET CHOICES FOR DEPT LIST
     con.query("Select id, prodName, price, qty from products WHERE qty > 0 AND ?",
          { deptID: prodID },
          function (err, results) {
               if (err) throw err;
               results.forEach(o => {
                    let item = {
                         name: `${o.prodName} - $${o.price.toFixed(2)} - remianing stock:${o.qty}`,
                         value: o.id,
                         qty: o.qty,
                         prodName: o.prodName
                    }
                    items.push(item);
               })
               items.push({name:"Exit", value:0})
               con.end();
               inq.prompt([
                    {
                         message: "What item do you want to purchase?",
                         type: "list",
                         name: "item",
                         choices: function () {
                              return items;
                         }
                    },
                    {
                         message: "How many do you want to purchase?",
                         type: "input",
                         name: "qty",
                         validate: function (value) {
                              let pass = !isNaN(value) && parseInt(value) > 0;
                              if (pass) {
                                   return true;
                              } else {
                                   return "Please enter a valid number";
                              }
                         },
                         when: function(arg){
                              return arg.item != "0"
                         }
                    }
               ])
                    .then(function (resp) {
                         if(resp.item == "0"){
                              askDepartment();
                              return;
                         }
                         let qty = parseInt(resp.qty);
                         curItem = items.find(x => {
                              return x.value.toString() == resp.item;
                         });
                         if (qty < 1) {
                              console.log("WTF DUDE");
                              getProduct(prodID)
                         } else if (curItem.qty < qty) {
                              console.log("There is not enough inventory to fulill your order.");
                              getProduct(prodID)
                              return;
                         }
                         con = sql.createConnection(conOpts);
                         con.connect(function (err) {
                              if (err) throw err;
                         });
                         con.query("UPDATE products SET ? WHERE ?", [
                              {
                                   qty: curItem.qty - qty
                              },
                              {
                                   id: resp.item
                              }
                         ], function (err, results) {
                              if (err) throw err;
                              console.log(qty + " " + curItem.prodName + " ordered\n\n");
                              welcomeScreen();
                         });
                    });
          })

}
let askDepartment = function () {
     let depts = [];
     con = sql.createConnection(conOpts);
     con.connect(function (err) {
          if (err) throw err;
     });
     //GET CHOICES FOR DEPT LIST
     con.query("Select * from department", function (err, results) {
          if (err) throw err;
          results.forEach(o => {
               let dept = {
                    name: o.deptName,
                    value: o.deptID
               }
               depts.push(dept);
               
          })
          depts.push({name:"Exit", value:0})
          con.end();
          inq.prompt([
               {
                    message: "What department do you want to look in?",
                    type: "list",
                    name: "department",
                    choices: function () {
                         return depts;
                    }
               }
          ])
          .then(function (resp) {
               if(resp.department == "0" ){
                    welcomeScreen();
                    return;
               }
               getProduct(resp.department);
          });
     })
}
/***** END SHOPPING SECTION *****/





/***** INV CHECK SECTION *****/
let checkStock = function () {
     let depts = [];
     let numchceked = 0;
     con = sql.createConnection(conOpts);
     con.connect(function (err) {
          if (err) throw err;
     })
     con.query("SELECT d.deptName, d.deptID, Count(p.prodName) as grp FROM PRODUCTS as p INNER JOIN department as d ON d.deptID = p.deptID WHERE qty <= targetQty*.15 OR  qty <= 1  GROUP BY d.deptID ", function (err, results) {
          if (err) throw err;
          depts = results;
          depts.forEach(o => {
               async function asyncCall() {
                    var result = await getItemData(o.deptID);
                    console.log("DEPARTMENT:", o.deptName.toUpperCase());
                    let cols = columnify(result, {
                         minWidth: 8,
                         config: {
                              qty: {maxWidth: 4},
                              Product: {minWidth: 80}
                         },
                         columnSplitter: ' | '})
                    console.log(cols)
                    console.log("\n\n")
                    numchceked++;
                    if(numchceked == results.length){
                         welcomeScreen();
                    }
               }
               function getItemData(arg) {
                    return new Promise(resolve => {
                         con.query(`SELECT id as 'Product ID', prodName as Product, qty, price FROM PRODUCTS WHERE (qty <= targetQty*.15 OR  qty <= 1) and deptID = ${arg} `, function (err, results) {
                              if (err) throw err;
                              resolve(results);
                         });
                    })
               }
               asyncCall();
          })
          con.end();
     });
}
/***** END INV CHECK SECTION *****/





/***** ADD INVETORY SECTION *****/
let orderInv = function () {
     let items = [];
     con = sql.createConnection(conOpts);
     con.connect(function (err) {
          if (err) throw err;
     });
     //GET CHOICES FOR DEPT LIST
     con.query("SELECT id as 'Product ID', prodName as Product, qty, price FROM PRODUCTS WHERE qty <= targetQty*.15 OR  qty <= 1 ORDER BY qty", function (err, results) {
          if (err) throw err;
          results.forEach(o => {
               let prodN = o.Product.toString().substr(0, 40 );              
               let item = {
                    name: pad(prodN, (45), "_") + "QTY: "+ o.qty + " - PRICE: $"+o.price,
                    value: o["Product ID"],
                    qty: o.qty,
                    price: o.price,
                    prod: o.Product
               }
               items.push(item);
          })
          items.push({
               name:"Exit",
               value:0
          })
          con.end();
          inq.prompt([
               {
                    message: "What product do you wish to restock?",
                    type: "list",
                    name: "prodID",
                    choices:items
               },
               {
                    message: "How many units are you adding to the inventory?",
                    type: "input",
                    name: "qty",
                    validate: function (value) {
                         let pass = !isNaN(value) && parseInt(value) > 0;
                         if (pass) {
                              return true;
                         } else {
                              return "Please enter a valid number";
                         }
                    },
                    when: function(arg){
                         return arg.prodID != "0"
                    }
               }          
          ])
          .then(function (resp) {
               if(resp.prodID == "0"){
                    welcomeScreen();
                    return;
               }
               let res = resp;
               let curItem = items.find( o => {
                    return o.value == res.prodID;
               })
               inq.prompt([
                    {
                    message: `Are you sure you want to add ${res.qty} units to the ${curItem.prod} inventory?`,
                    type: "confirm",
                    name: "confirmed"
                    }
               ])
               .then(function (resp){
                    if(resp.confirmed){
                         addInventory(res.prodID ,res.qty)
                    }
               })
          });
     });
}
function addInventory(id, qty){
     let curQty = 0;
     con = sql.createConnection(conOpts);
     con.connect(function (err) {
          if (err) throw err;
          
     });
     //GET CHOICES FOR DEPT LIST
     con.query(`SELECT qty FROM PRODUCTS WHERE id = ${id}`,
     function (err, results) {
          if (err) throw err;
          curQty = parseInt(qty)+parseInt(results[0].qty);
          con.query("UPDATE products  SET ? WHERE ?", [          
               {qty: curQty},
               {id: id}
          ],function (err, results) {
               if (err) {
                    throw err;
               }
               console.log("Added", qty, "items");
               con.end();
               orderInv();
          });
     });
     
     
     
     
}
/***** END ADD INVETORY SECTION *****/





let newProd = function () {
     let depts= [];
     con = sql.createConnection(conOpts);
     con.connect (function(err){
          if(err) throw err;
     });
     let getDeptsRet = async function(){          
          let result = await getDepts();
          result.forEach( o =>{
               let dept = {
                    name: o.deptName,
                    value:o.deptID
               }
               depts.push(dept);
          });
          con.end();
          inq.prompt(qs)
          .then(function(response){
               confirmAdd(response);
          })
     }
     function getDepts(){
          return new Promise(resolve => {
               con.query(`SELECT deptID, deptName FROM department`, function (err, results) {
                    if (err) throw err;
                    resolve(results);
               });
          })
     }
     let qs = [
          {
               message:"Product Name",
               name:"prodName",
               type:"input"
          },
          {
               message: "Product department?",
               type:"list",
               name:"deptID",
               choices:function(){
                    return depts;
               }
          },
          {
               message:"Price?",
               name:"price",
               type:"input",
               validate: function (value) {
                    let pass = !isNaN(value) && parseInt(value) > 0;
                    if (pass) {
                         return true;
                    } else {
                         return "Please enter a valid price";
                    }
               }
          },
          {
               message:"Current Inventory?",
               name:"qty",
               type:"input",
               validate: function (value) {
                    let pass = !isNaN(value) && parseInt(value) > 0;
                    if (pass) {
                         return true;
                    } else {
                         return "Please enter a valid number";
                    }
               }
          },
          {
               message:"Target Inventory? (Once current inventory drops to or or 15% of the traget invenotry, it appears in the low inventory report.",
               name:"targetQty",
               type:"input",
               validate: function (value) {
                    let pass = !isNaN(value) && parseInt(value) > 0;
                    if (pass) {
                         return true;
                    } else {
                         return "Please enter a valid inventory level";
                    }
               }
          }

     ];
     
     function confirmAdd(arg){
          inq.prompt([{
               type:"confirm",
               message: `Proposed new item:\nName: ${arg.prodName}\nDepartment: ${depts.find( o =>{
                    return arg.deptID == o.value;
               }).name}\nPrice: ${arg.price}\nQuantity: ${arg.qty}\nTarget Inventory: ${arg.targetQty}\n`,
               name:"confirmed"
          }])
          .then(function(resp){
               if(resp.confirmed){
                    con = sql.createConnection(conOpts);
                    con.connect(function(err){
                         if (err)throw err;
                         console.log("connected");
                    });
                    let qury = "INSERT INTO products SET ?";
                    con.query(qury,arg, function(err, results){
                         if(err) throw err;
                         console.log("Added", arg.prodName, "to inventory");
                         con.end();
                         welcomeScreen();
                    })
               }else{
                    welcomeScreen();
               }
          });
     }
     getDeptsRet();
}

let welcomeScreen = function () {
     inq.prompt([
          {
               message: "What would you like to do?",
               type: "list",
               name: "action",
               choices: [
                    {
                         name: "View Products for Sale",
                         value: "shop"
                    },
                    {
                         name: "View Low Inventory",
                         value: "lowStock"
                    },
                    {
                         name: "Add to Inventory",
                         value: "orderInv"
                    },
                    {
                         name: "Add New Product",
                         value: "newProd"
                    },
                    {
                         name: "Exit",
                         value: "exit"
                    }
               ]

          }
     ])
          .then(function (resp) {
               switch (resp.action) {
                    case "shop":
                         askDepartment();
                         break;
                    case "lowStock":
                         checkStock();
                         break;
                    case "orderInv":
                         orderInv();
                         break;
                    case "newProd":
                         newProd();
                         break;
                    default:
                         break;
               }
          });
}

welcomeScreen();