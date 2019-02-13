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


let getSales = function(){
     con = sql.createConnection(conOpts);
     con.connect(function(err){
          if(err) throw err;
     });

     con.query(`SELECT d.deptName, SUM(pu.itemPrice*pu.qty) as totalSales
     FROM purchaseitems as pu INNER JOIN 
     products as p ON p.id = pu.itemID INNER JOIN 
     department as d ON d.deptID = p.deptID 
     GROUP BY d.deptID
     order by d.deptName
     `,
     function(err, deptResult){
          if(err) throw err;         
          let numchceked = 0;
          deptResult.forEach( o => {
               console.log("Depratment", o.deptName,  "Sales", o.totalSales);
               async function getSalesPrDept() {
                    let result = await getItemSales(o.deptID);
                    console.log(`\nDEPARTMENT: ${o.deptName.toUpperCase()} Sales: $${o.totalSales}`);
                    let cols = columnify(result, {
                         minWidth: 8,
                         config: {
                              qty: {maxWidth: 4},
                              Product: {minWidth: 65}
                         },
                         columnSplitter: ' | '})
                    console.log(cols)
                    numchceked++;
                    if(numchceked == deptResult.length){
                         console.log("\n");
                         welcomeScreen();
                    }
               }
               function getItemSales(arg) {
                    return new Promise(resolve => {
                         con.query(`
                         SELECT p.prodName as Product,  SUM(pu.qty) as 'Units Sold', SUM(pu.itemPrice*pu.qty) as 'Total Sales'
                         FROM purchaseitems as pu INNER JOIN 
                         products as p ON p.id = pu.itemID INNER JOIN 
                         department as d ON d.deptID = p.deptID 
                         where d.deptName = '${o.deptName}'
                         GROUP BY d.deptID, p.prodName
                         order by  'Units Sold' desc`, function (err, results) {
                              if (err) throw err;
                              resolve(results);
                         });
                    })
               }
               getSalesPrDept();
          });
          
          welcomeScreen();
     });



     
     
}


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
                    console.log("\n")
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


let newDept = function(){
     con = sql.createConnection(conOpts);
     con.connect (function(err){
          if(err) throw err;
     });
     inq.prompt(theQ.newDeptQs)
     .then(function(response){
          confirmAddDept(response);
     })

     function confirmAddDept(arg){
          inq.prompt(theQ.confrimNewDeptQ(arg))
          .then(function(resp){
               if(resp.confirmed){
                    con = sql.createConnection(conOpts);
                    con.connect(function(err){
                         if (err)throw err;
                         console.log("connected");
                    });
                    let qury = "INSERT INTO department SET ?";
                    con.query(qury, arg, function(err, results){
                         if(err) throw err;
                         console.log("Added", arg.deptName, "to departments");
                         con.end();
                         welcomeScreen();
                    })
               }else{
                    welcomeScreen();
               }
          });
     }
}


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
                    case "newDept":
                         newDept();
                         break;
                    case "viewSales":
                         getSales();
                         break; 
                    default:
                         if(con.state == "authenticated")
                              con.end();
                         break;
               }
          });
}

welcomeScreen();