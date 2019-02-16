I use moment package for timestamping the save function in UTC format for purchase data. Pad and Colmnify is used to help organize the items into a more table like structure.  

Creating multiple branches for adding features and keeping sections of code separate.

Customer's entrance point is customer.js. I modified the exercise to allow users to choose a category to narrow down the options. Instead of requiring the user to pick a product id, I provide the names of the items and then  it pulls the id from the name. This makes selecting the product easier to understand.

My db structure (schema.sql) is set up with a more long-term goal in mind. I have products in one table, orders in one table, purcahseitems in another. Technically an order would contain multiple items. The items would have an order id column in it to link it to the order. Departments was also placed in a separate table and the item references the department id. Purchases include a time stamp date referencing UTC time.

I have a branch (featAddDept) to create department portion of the tool but was not able to finish it completely. The department aspect of it is done but the overhead costs are not included.  
