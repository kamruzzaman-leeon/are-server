const express = require('express');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send('aRe is ready')
})

app.listen(port,()=>{
    console.log(`aRe is running on ${port}`);
})