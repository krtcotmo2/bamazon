let purchaseQ = function(theItems){
     return [
     {
          message: "What item do you want to purchase?",
          type: "list",
          name: "item",
          choices: function () {
               return theItems;
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
];
}

let newProdQs = function(depts){
     return [
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

]
};

let newDeptQs = [
     {
          message: "What is the name of the new department?",
          type: "input",
          name: "deptName"
     }
];

let confrimNewDeptQ = function(theDept){
     return [{
     type:"confirm",
     message: `Proposed new Department:\nName: ${theDept.deptName}\n`,
     name:"confirmed"
}]
}

let openQ = [
     {
          message: "What would you like to do?",
          type: "list",
          name: "action",
          choices: [
               {
                    name: "View Products Sales",
                    value: "viewSales"
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
                    name: "Add New Department",
                    value: "newDept"
               },
               {
                    name: "Exit",
                    value: "exit"
               }
          ]

     }
];


let deptQ = function(depts){
return [
     {
          message: "Welcome to Bamazon\n\nWhat department do you want to shop from?",
          type: "list",
          name: "department",
          choices: function () {
               return depts;
          }
     }
]
};

let restockQ = function(theItems){
     return [
     {
          message: "What product do you wish to restock?",
          type: "list",
          name: "prodID",
          choices:theItems
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
]
};

let confirmRestockQ = function(theItem, curProd){
     return [
     {
     message: `Are you sure you want to add ${theItem.qty} units to the ${curProd.prod} inventory?`,
     type: "confirm",
     name: "confirmed"
     }
]
};

let confrimNewItemQ = function(theItem, depts){
     return [{
     type:"confirm",
     message: `Proposed new item:\nName: ${theItem.prodName}\nDepartment: ${depts.find( o =>{
          return theItem.deptID == o.value;
     }).name}\nPrice: ${theItem.price}\nQuantity: ${theItem.qty}\nTarget Inventory: ${theItem.targetQty}\n`,
     name:"confirmed"
}]
}

module.exports = {purchaseQ, newProdQs, openQ, deptQ, restockQ, confirmRestockQ,confrimNewItemQ, newDeptQs, confrimNewDeptQ}