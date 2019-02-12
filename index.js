const sql = require("mysql");
const inq = require("inquirer");
const moment = require("moment");
const pad = require('pad/lib/es5');
let columnify = require('columnify');
const theQ = require("./inqQs");
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
                         prodName: o.prodName,
                         price: o.price.toFixed(2)
                    }
                    items.push(item);
               })
               items.push({name:"Exit", value:0})
               con.end();
               inq.prompt(theQ.purchaseQ(items))
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
                              getProduct(prodID);
                              return;
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
                              {qty: curItem.qty - qty},
                              {id: resp.item}
                         ], function (err, results) {
                              if (err) throw err;
                              //ADD DATA TO ORDERS  
                              let val =  moment.utc().format("YYYY-MM-DD HH:mm:ss");
                              //connvert back to local time
                              //console.log(moment.utc(val).local().format("YYYY-MM-DD HH:mm:ss"))                      
                              con.query("INSERT INTO purchaseitems SET ?", 
                                   {orderID: Math.floor(Math.random()*10000) + 20000,
                                   qty: qty,
                                   itemPrice: curItem.price,
                                   itemID: resp.item,
                                   purchaseDate: val
                              }
                              , function (err, results) {
                                   if (err) {
                                        con.end()
                                        console.log(err);
                                        throw err;
                                   }
                                   console.log(qty + " " + curItem.prodName + " ordered for $"+(curItem.price*qty).toFixed(2)+"\n\n");
                                   con.end();
                                   welcomeScreen();
                              });
                              
                              
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
          inq.prompt(theQ.deptQ(depts))
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
               async function getShortInvHandler() {
                    let result = await getItemData(o.deptID);
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
               getShortInvHandler();
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
                    name: pad(prodN, (45), "-") + "QTY: "+ o.qty + " - PRICE: $"+o.price,
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
          inq.prompt(theQ.restockQ(items))
          .then(function (resp) {
               if(resp.prodID == "0"){
                    welcomeScreen();
                    return;
               }
               let res = resp;
               let curItem = items.find( o => {
                    return o.value == res.prodID;
               })
               inq.prompt( theQ.confirmRestockQ(res, curItem))
               .then(function (resp){
                    if(resp.confirmed){
                         addInventory(res.prodID ,res.qty)
                    }else{
                         orderInv();
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
          inq.prompt(theQ.newProdQs(depts))
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
     
     function confirmAdd(arg){
          inq.prompt(theQ.confrimNewItemQ(arg, depts))
          .then(function(resp){
               if(resp.confirmed){
                    con = sql.createConnection(conOpts);
                    con.connect(function(err){
                         if (err)throw err;
                         console.log("connected");
                    });
                    let qury = "INSERT INTO products SET ?";
                    con.query(qury, arg, function(err, results){
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
     inq.prompt(theQ.openQ)
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
                         if(con.state == "authenticated")
                              con.end();
                         break;
               }
          });
}

welcomeScreen();