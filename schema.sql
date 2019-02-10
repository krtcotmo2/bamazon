use bamazon;

CREATE TABLE department (
  deptID int(11) NOT NULL,
  deptName varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (deptID)
) 

CREATE TABLE orders (
  orderID int(11) NOT NULL,
  orderDate timestamp NOT NULL,
  buyerName varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  shipAdd1 varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  shipAdd2 varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  shipCity varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  shipState varchar(2) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  shipZip varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (orderID)
) 

CREATE TABLE products (
  id int(11) NOT NULL AUTO_INCREMENT,
  prodName varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  deptID int(11) NOT NULL,
  price decimal(10,2) NOT NULL,
  qty int(11) NOT NULL,
  PRIMARY KEY (id)
)

CREATE TABLE purchaseitems (
  orderID int(11) NOT NULL,
  itemID int(11) NOT NULL,
  itemPrice decimal(10,2) NOT NULL,
  qty int(11) NOT NULL,
  PRIMARY KEY (itemID)
)
