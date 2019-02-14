I use moment package for timestamping the save function in UTC format for purcahse data. Pad and Colmnify is used to help organize the items into a more table like structure.  

Creating multiple branches for adding features and keeping sections of code separate.

Customer's enterance point is customer.js. I modified the exercise to allow users to choose a category to narrow down the options. Instead of requiring the user to pick a priduct id, I provide the names of the items and then  it pulls the id from teh name. This makes selecting the product easier to understand.

My db struture is set up with a more long term goal in mind. I have products in one table, orders in one table, purcahseitems in another. Technically an order would contian multiple items. The items would have an order id column in it to link it to the order. Departments was also placed in a separate table and the item refernces the department id.
