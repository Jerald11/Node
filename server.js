const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
var crypto = require('crypto');

const app = express();
const port = 3002;

// app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.json({
    limit: '50mb',
    parameterLimit: 1000000,
    extended: true 
  }));
  

app.use(function (req, res, next) {
	let allowedOrigins = [
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:3002",
        "http://18.167.84.197:3002",
        "http://18.167.84.197:5501"];
	let origin = req.headers.origin;
	 
	 if (allowedOrigins.includes(origin)) {
		 res.setHeader('Access-Control-Allow-Origin', origin);
	 }
	 res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	 res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	 res.setHeader('Access-Control-Allow-Credentials', true);
	 next();
 });


 require('custom-env').env('dev');
 process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;


app.get("/FID", (res) => { 
    res.send("Connected Here");
})

const storage = multer.diskStorage({
    destination: './Images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({
    storage: storage
})
app.use('/file', express.static('images'));
app.post("/upload", upload.single('file'), (req, res) => {
    res.json({
        success: 1,
        profile_url: `${req.file.filename}`
    })
})

function errHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        res.json({
            success: 0,
            message: err.message
        })
    }
}
app.use(errHandler);


var dbConfig = {
	server:  "EC2AMAZ-P5S4K5U",
	port: 1433,
	user: "entrogo_db",
	password: '@3n',
	database: "Entrego",
	driver: 'tedious',
	stream: false,
    dialect: "mssql",
    dialectOptions: {
      requestTimeout: 300000
    },
	options: {
		encrypt: false
	},
	pool: {
		max: 1,
		min: 0,
		idleTimeoutMillis: 10000
	}
}


function runQuery(query) {
	sql.connect(dbConfig)
	   .then((pool) => {
		   return pool.query(query);
	   })
	   .then((result) =>{
		   return result;
	   });
   sql.on('error', err => {
	   return err;
   });
}

app.get("/GetUser", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`SELECT * FROM OUSR T0 WHERE T0.[UserName]='${req.query.userName}' and [UPassword]='${req.query.Password}'`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
               
        });
})


app.get("/getInventoryRecord", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`SELECT * FROM OINV`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
        });
})


app.get("/getTransid", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`SELECT * FROM OTXN Where Type ='${req.query.type}'`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
        });
})

app.post("/updateTransid", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`Update OTXN set DocNum = '${req.query.Doc}' where Type ='${req.query.Type}'`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
        });
})


app.post("/AddUser", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`Insert Into OUSR values ('${req.query.UserName}','${req.query.oPassword}','${req.query.EmailAdd}','Customer','${req.query.oHouseNo}','${req.query.oStreet}','${req.query.oBrgy}','${req.query.oCity}','${req.query.oProvince}','${req.query.Fname}','${req.query.MName}','${req.query.LName}','','O')`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
        });
})


app.post("/onAddtoCart", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`Update OINV set OrderStatus = 'O',iStatus = 'Reserved',ExpiryTime='${req.query.Timer}', Orderby ='${req.query.userid}' Where id ='${req.query.id}'`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
        });
})

app.post("/oUpdateInventory", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`Update OINV set OrderStatus = 'O',iStatus = 'Ordered',TransactionNo = '${req.query.DocNum}',Orderby ='${req.query.userid}',Date_Ordered=${req.query.OrderDate} Where id ='${req.query.id}'`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
        });
})



app.get("/Expired", (req, res) => {
    var connectionPool = new sql.ConnectionPool(dbConfig)
        .on('error', onerror => {console.log("Error in Pool " + err );})
        .connect() 
        .then( pool => {
             pool.query(`Select A.TransactionID from ORDR A Inner Join OINV B on B.TransactionNO =  A.TransactionID Where B.OrderStatus = 'O'`)
                .then( result => {
                res.send(result.recordset);
                })
                .catch( err => {
                    console.log(err);
                });
        });
})


app.post("/AddInventory", (req, res) => {
    var oData = [];
    try{
	for(var i = 0;i < req.body.length;i++){ 
		oData.push({
            "SKU_Name": req.body[i].SKU_Name,
            "SKU_Code": req.body[i].SKU_Code,
            "SKU_Description": req.body[i].SKU_Description,
            "Category": req.body[i].Category,
            "Price": req.body[i].Price,
            "Quantity": req.body[i].Quantity,
            "UnitOfMeasure": req.body[i].UnitOfMeasure,
            "iMonth": req.body[i].iMonth,
            "iYear": req.body[i].iYear,
		});
	}

	for(var x = 0;x < oData.length;x++){
			var sInsertStatement = `Insert Into OINV(SKU_Name,SKU_Code,SKU_Description,Category,Price,Quantity,UnitOfMeasure,iMonth,iYear) values ('${oData[x].SKU_Name}','${oData[x].SKU_Code}'
            ,'${oData[x].SKU_Description}','${oData[x].Category}','${oData[x].Price}','${oData[x].Quantity}',
            '${oData[x].UnitOfMeasure}','${oData[x].iMonth}','${oData[x].iYear}')`;
			var oResult = runQuery(sInsertStatement)	
	}	
        res.send("Success");
    }catch (e){
        console.log(e);
    }
});



app.listen(port, () => {
    console.log("API is running on port " + port);
})



module.exports = app;