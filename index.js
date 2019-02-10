const sql = require("mysql");
const inq = require("inquirer");
const time = require("moment")
const conOpts = {
     host:"localhost",
     port:"3306",
     user:"root",
     password:"Password1",
     database:"bamazon"
};
let con = sql.createConnection(conOpts);

let getProduct = function(arg){
     let items = [];
     let curItem ={};
     let prodID = arg;
     con = sql.createConnection(conOpts);
     con.connect(function(err){
          if (err) throw err;
     });
     //GET CHOICES FOR DEPT LIST
     con.query("Select * from products WHERE qty > 0 AND ?",
     {deptID : prodID}, 
     function(err, results){
          if(err) throw err;
          results.forEach( o =>{                    
               let item = {
                    name: `${o.prodName} - $${o.price.toFixed(2)} - remianing stock:${o.qty}`,
                    value: o.id,
                    qty: o.qty,
                    prodName:o.prodName
               }
               items.push(item);
          })
          con.end();
          inq.prompt([
               {
                    message: "What item do you want to purchase?",
                    type: "list",
                    name: "item",
                    choices:function(){
                         return items;
                    }
               },
               {
                    message: "How many do you want to purchase?",
                    type: "input",
                    name: "qty",
                    validate: function( value ) {
                         var pass = !isNaN(value) && parseInt(value)>0;
                         if (pass) {
                              return true;
                         } else {
                              return "Please enter a valid number";
                         }
                    }
               }
          ])
          .then(function (resp) {
               let qty = parseInt(resp.qty);
               curItem = items.find( x => {
                    return x.value.toString() == resp.item;                    
               });
               if(qty<1){
                    console.log("WTF DUDE");
                    getProduct(prodID)
               }else if (curItem.qty < qty){
                    console.log("There is not enough inventory to fulill your order.");
                    getProduct(prodID)
                    return;
               }
               con = sql.createConnection(conOpts);
               con.connect(function(err){
                    if (err) throw err;
               });
               con.query("UPDATE products SET ? WHERE ?", [
                    {
                         qty:curItem.qty - qty
                    },
                    {
                         id: resp.item
                    }
               ],function(err, results){
                    if(err) throw err;
                    console.log(qty + " " +curItem.prodName + " ordered\n\n" );
                    welcomeScreen();
               });
          });
     })    

}

let askDepartment = function(){
     let depts = [];
     con = sql.createConnection(conOpts);
     con.connect(function(err){
          if (err) throw err;
     });
     //GET CHOICES FOR DEPT LIST
     con.query("Select * from department", function(err, results){
          if(err) throw err;
          results.forEach( o =>{                    
               let dept = {
                    name: o.deptName,
                    value: o.deptID
               }
               depts.push(dept);
          })
          con.end();
          inq.prompt([
               {
                    message: "What department do you want to look in?",
                    type: "list",
                    name: "department",
                    choices:function(){
                         return depts;
                    }                        
               }
          ])
          .then(function (resp) {
               getProduct(resp.department);
          });
     })     
}
let checkStock = function(){
     
}
let orderInv = function(){
     
}
let newProd = function(){
     
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