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
                                   askDepartment();
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
askDepartment();