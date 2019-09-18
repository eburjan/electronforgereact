//import React from 'react';
import React, { Component } from 'react';
const { dialog } = require('electron').remote;
var fs = require('fs');
var Excel = require("exceljs");
var path = require('path');

export default class App extends Component {

  constructor()
  {
      super();
      this.state={
          xlsPathSB: '',
          xlsPathFSB: '',
          xlsPathPROJECT: '',
          xlsResult:''
      };
      this.clickhandler_LoadXLS_SB = this.clickhandler_LoadXLS_SB.bind(this);
      this.clickhandler_LoadXLS_FSB = this.clickhandler_LoadXLS_FSB.bind(this);
      this.clickhandler_LoadXLS_PR = this.clickhandler_LoadXLS_PR.bind(this);
      this.clickhandler_SaveXLS= this.clickhandler_SaveXLS.bind(this);
      this.clickhandler_Start= this.clickhandler_Start.bind(this);
      //mikor kell a bind? jelen esetben nincs parameteruk, es nem arrow f-k.
  }

  clickhandler_LoadXLS_SB()
  {
    console.log("button LoadXLS_SB pressed");    
    dialog.showOpenDialog((fileNames) => {
      if(fileNames === undefined){console.log("No file selected");return;}
      this.setState({xlsPathSB: fileNames[0]});
    });
  }

  clickhandler_LoadXLS_FSB()
  {
    console.log("button LoadXLS_FSB pressed");    
    dialog.showOpenDialog((fileNames) => {
      if(fileNames === undefined){console.log("No file selected");return;}
      this.setState({xlsPathFSB: fileNames[0]});
    });
  }

  clickhandler_LoadXLS_PR()
  {
    console.log("button LoadXLS_PR pressed");    
    dialog.showOpenDialog((fileNames) => {
      if(fileNames === undefined){console.log("No file selected");return;}
      this.setState({xlsPathPROJECT: fileNames[0]});
    });
  }

  clickhandler_SaveXLS()
  {
    console.log("button SaveXLS pressed");
    let dir=path.dirname(this.state.xlsPathPROJECT);
    let file=document.getElementById("result").value+".xlsx";
    let fullpath=path.join(dir,file);
    this.setState({xlsResult: fullpath});
  }

  clickhandler_Start()
  {
    if(this.state.xlsPathFSB.length<5 || this.state.xlsPathSB.length<5 ||
      this.state.xlsResult.length<5 || this.state.xlsPathPROJECT.length<5)
    {
      alert("At least one input file is not defined/too short! ");
      return;
    }

    readProjectAndCalculatePrices(this.state.xlsPathFSB, 
      this.state.xlsPathSB, this.state.xlsPathPROJECT)
    .then((calculatePricesResult)=>createResultFile(this.state.xlsPathPROJECT, this.state.xlsResult))
    .catch((error)=>handleError(error));
  }

  /*
  !!!!!!!!!
  https://blog.jscrambler.com/building-expense-application-electron-react/
  !!!!!!!!!
  https://stackoverflow.com/questions/43311513/whats-the-proper-way-to-handle-forms-in-electron
  https://stackoverflow.com/questions/38530293/electron-get-full-path-of-uploaded-file
  https://github.com/SimulatedGREG/electron-vue/issues/389#issuecomment-475348490
  <div>{this.state.xlsPathSB.toUpperCase()}</div>
        className='f4 link dim br2 ph5 pv3 ml3 mb2 dib white bg-mid-gray'
        onClick={this.clickhandler}

    dialog.showOpenDialog((fileNames) => {
      // fileNames is an array that contains all the selected
      if(fileNames === undefined)
      {
          console.log("No file selected");
          return;
      }
      console.log("File selected: "+ fileNames[0]);
      this.setState({xlsPathSB: fileNames[0]});
    }

  */

  render() {
    return (<div>
      <div className="tc">
      <h5> </h5>
      <img src="./clinaLogo.jpg" height="70" ></img>
      <h5> </h5>
      </div>
      <div className="tc">
        <input 
          className='f4 link dim br2 ph5 pv3 ml3 mb2 dib white bg-mid-gray'
          type='button' 
          value='Load SB.xlsx'
          onClick={this.clickhandler_LoadXLS_SB}
        />      
        <div>[{this.state.xlsPathSB}]</div>
        <h5> </h5>
        <input 
          className='f4 link dim br2 ph5 pv3 ml3 mb2 dib white bg-mid-gray'
          type='button' 
          value='Load FSB.xlsx'
          onClick={this.clickhandler_LoadXLS_FSB}
        />      
        <div>[{this.state.xlsPathFSB}]</div>
        <h5> </h5>
        <input 
          className='f4 link dim br2 ph5 pv3 ml3 mb2 dib white bg-mid-gray'
          type='button' 
          value='Load PROJECT.xlsx'
          onClick={this.clickhandler_LoadXLS_PR}
        />      
        <div>[{this.state.xlsPathPROJECT}]</div>

        <h3>─────────────────────────────────────</h3>
        <h3>Enter name for RESULT.xlsx</h3>
        <input 
          className='f4 link dim br2 ph5 pv3 ml3 mb2 dib white bg-mid-gray'
          name='result'
          id='result'
          type='text' 
          onChange={this.clickhandler_SaveXLS}
        />      
        <div>[{this.state.xlsResult}]</div>        

        <h5> </h5>
        <input 
          className='f4 link dim br2 ph5 pv3 ml3 mb2 dib red bg-light-gray'
          type='button' 
          value='START'
          onClick={this.clickhandler_Start}
        />
        <h5> </h5>
      </div>
      <div className="tc">
        <h5> </h5>
        <p className="f6 ml3 pa5 mid-gray">© Báró Júlia, Burján Ernő</p>
      </div>
    </div>);
  }
}

//globalis valtozok
let mainColumnArr;
let mainRowArr;
let readWorksheet;
let idsArrFSB_SB = [];
var errorList=[];

let codeStart1 = "FSB.20.";
let codeStart2 = "SB.20.";

let projectProductIdArr;
let quantityArr;
var projectWorksheet;
let idsAndQuantityArr = [];

let arrOfAllElements = [];

let sum = [];

let unitPriceArr = [];
let fullPriceArr = [];
let arrOfProjectColumns = [];

function Init()
{
    idsArrFSB_SB = [];
    errorList=[];
    idsAndQuantityArr = [];    
    arrOfAllElements = [];
    sum = [];    
    unitPriceArr = [];
    fullPriceArr = [];
    arrOfProjectColumns = [];
}

//id ellenorzo fuggveny
function checkId(productid)
{
    if (productid.match(/^[F]?SB.([0-9]{2}).([0-9]{4}).([0-9]{4}).([0-9]{2})$/))
    {
        return true;
    }
    else
    {
        return false;
    }
}

//megnezi, hogy a cellak tipusa string / szam-e
function checkCellType(cell)
{
    if (typeof cell === "string" || typeof cell === "number")
    {
        return true;
    }
    else
    {
        //console.log("false " + typeof cell + " " + cell);
        return false;
    }
}

//ez a fuggveny minden Project.xlsx oszlopot egy arrayen beluli arraybe masol
function readAllProjectColumns(project)
{
    console.log("readAllProjectColumns entered");

    let readWorkbook = new Excel.Workbook();
    return readWorkbook.xlsx.readFile(project)
    .then((readFileResult)=>
    {
        console.log("readAllProjectColumns readFile handler called");

        let columnIndexArr = ["A", "B", "C", "D", "E", "F", "G", "H"]; 

        for (let j = 0; j < columnIndexArr.length; j++)
        {
            let worksheet = readWorkbook.getWorksheet('Matten');
            let nameColArr = worksheet.getColumn(columnIndexArr[j]).values;
            for(let k=0;k<nameColArr.length;k++)
            {
                if(k>3 && !checkCellType(nameColArr[k]))
                {
                    errorList.push("type error: "+project+", col "+j+", row "+k);
                }
            }
            arrOfProjectColumns.push(nameColArr);
        }

        if(errorList.length>0)
        {
            console.log("readAllProjectColumns readFile handler failed");
            throw "readProject failed in "+project;
        }

        return arrOfProjectColumns.length;
    });
}

//xlsx iro fuggveny - lemasolja a Project.xlsx-t + az egysegar oszlopot + a mennyiseg szerinti ar oszlopot + az vegarat
function createResultFile(project, result)
{
    console.log("createResultFile entered");

    return readAllProjectColumns(project)
    .then((readProjectResult)=>
    {
        console.log("createResultFile readAllProjectColumns handler called");

        let mergeWorkbook = new Excel.Workbook();
        let mergeWorksheet = mergeWorkbook.addWorksheet('Matten');

        let columnIndexArr1 = ["A", "B", "C", "D", "E", "F", "G", "H"]; 
        let columnIndexArr2 = ["I", "J", "K"];

        for (let i = 0; i < columnIndexArr1.length; i++)
        {
            mergeWorksheet.getColumn(columnIndexArr1[i]).values = arrOfProjectColumns[i];
        }

        //console.log("unitPriceArr.length elotte: " + unitPriceArr.length);
        //console.log("fullPriceArr.length elotte: " + fullPriceArr.length);

        for (let i = 0; i < arrOfAllElements.length; i++)
        {
            unitPriceArr.push(arrOfAllElements[i].unitPrice);
            fullPriceArr.push(arrOfAllElements[i].fullPrice);
        }

        //console.log("unitPriceArr.length utana: " + unitPriceArr.length);
        //console.log("fullPriceArr.length utana: " + fullPriceArr.length);

        unitPriceArr.unshift("", "", "", "Einzelpreis");
        fullPriceArr.unshift("", "", "", "Totalpreis"); 

        //console.log("unitPriceArr.length utana2: " + unitPriceArr.length);
        //console.log("fullPriceArr.length utana2: " + fullPriceArr.length);
        
        sum.unshift("", "", "", "Gesamtpreis");

        mergeWorksheet.getColumn(columnIndexArr2[0]).values = unitPriceArr;
        //console.log("arrOfAllElements.length mergedResult: " + arrOfAllElements.length);
        mergeWorksheet.getColumn(columnIndexArr2[1]).values = fullPriceArr;
        mergeWorksheet.getColumn(columnIndexArr2[2]).values = sum;

        return mergeWorkbook.xlsx.writeFile(result)
        .then((writeFileResult)=>
        {
            console.log("createResultFile : Result file written ");
            alert("Completed");
            return 0;
            /*console.log(mergeWorksheet.getColumn(columnIndexArr1[1]).values);
            console.log(mergeWorksheet.getColumn(columnIndexArr2[0]).values);
            console.log(mergeWorksheet.getColumn(columnIndexArr2[1]).values);
            console.log(mergeWorksheet.getColumn(columnIndexArr2[2]).values);*/
        })
    })
}

//ez a fuggveny osszeallitja a matrix fileok alapjan az id-kat es hozzarendeli a megfelelo egysegarat
function readPriceList(FSB_SB, codeStart) 
{
    console.log("readPriceList entered 4 "+FSB_SB);

    let workbook = new Excel.Workbook();
    let countFSB_SB = 0;
    return (workbook.xlsx.readFile(FSB_SB)
    .then((readFileResult)=>
    {
        console.log("readPriceList readFile handler called 4 "+FSB_SB);

        readWorksheet = workbook.getWorksheet('Munka1');
        mainColumnArr = readWorksheet.getColumn('A').values;    
        mainRowArr = readWorksheet.getRow(2).values;

        let length1=idsArrFSB_SB.length;

        for (let i = 2; i < mainColumnArr.length; i++) 
        {
            if (mainColumnArr[i] < 1000) 
            {
                mainColumnArr[i] = "0" + mainColumnArr[i];
            }
        }
        readWorksheet = workbook.getWorksheet('Munka1');
        for (let i = 3; i < mainColumnArr.length; i++) 
        {
            let oneLine = readWorksheet.getRow(i).values;
            for (let j = 2; j < mainRowArr.length-1; j++) 
            {
                if(!checkCellType(mainRowArr[j]))
                {
                    errorList.push("type error in "+FSB_SB+", row "+j);
                }
                if(!checkCellType(mainColumnArr[i]))
                {
                    errorList.push("type error in "+FSB_SB+", column "+i);
                }
                if(!checkCellType(oneLine[j]))
                {
                    errorList.push("type error in "+FSB_SB+", cell value "+oneLine[j]);
                }
                countFSB_SB = countFSB_SB + 1;
                let euro = oneLine[j];
                let productid = (codeStart + mainRowArr[j] + "." + mainColumnArr[i] + ".00");
                if(!checkId(productid))
                {
                    errorList.push("error in "+FSB_SB+", productid: "+productid);
                }
                idsArrFSB_SB.push({productid, euro});
                //console.log({productid, euro});
                //console.log(countFSB_SB);
            }
        }
        if(errorList.length>0)
        {
            console.log("readPriceList readFile handler failed 4 "+FSB_SB);
            throw "pricelistReader failed in "+FSB_SB;
        }
        let length2=idsArrFSB_SB.length-length1;
        console.log(length2+" prices found in "+FSB_SB);
        return countFSB_SB;
    }));
}

//ez a fuggveny hivja meg a fenti fuggvent 2 kulonbozo parameter parra (FSB + SB)
function readAllPricesLists(FSB, SB)
{
    console.log("readAllPricesLists entered");
    return (readPriceList(FSB, codeStart1)
    .then((result)=>readPriceList(SB, codeStart2)));
}

function readProjectAndCalculatePrices(FSB, SB, project)
{
    console.log("readProjectAndCalculatePrices entered");
    Init();
    let workbook = new Excel.Workbook();

    return readAllPricesLists(FSB, SB)
    .then((readFSB_SBResult)=>workbook.xlsx.readFile(project)
    .then((readFileResult)=>
        {
            console.log("readProjectAndCalculatePrices readFile(project) called");
            //Beolvassa az id-s es a mennyiseges oszlopokat a project filebol.
            projectWorksheet = workbook.getWorksheet('Matten');
            projectProductIdArr = projectWorksheet.getColumn('A').values;  
            quantityArr = projectWorksheet.getColumn('C').values;

            console.log(quantityArr.length+" q.items found in "+project);
            console.log(projectProductIdArr.length+" p.items found in "+project);

            for (let i = 4; i < projectProductIdArr.length; i++) 
            {
                var id = projectProductIdArr[i];
                var value = quantityArr[i];
                if(value===undefined || (typeof value === "string" && value.includes("Stück")))
                {
                  console.log("skipping ["+value+"] at "+i);
                  continue;
                }

                idsAndQuantityArr.push({id, value});
                
                if(!checkCellType(value))
                {
                    errorList.push("type error in "+project+" at quantity row "+i);
                }
                if(!checkId(id))
                {
                    errorList.push("error in " +project+" at "+id);
                }
                //A termek id-t es a mennyiseget eltarolja egy objectben.
            }

            if(errorList.length>0)
            {
                console.log("readProjectAndCalculatePrices readFile(project) failed");
                throw "readProjectAndCalculatePrices failed in "+project;
            }            

            console.log(idsAndQuantityArr.length+" p-q pairs in "+project);

            //Megkeresi a projekt fileban szereplo kodokat a matrixos arrayben.
            console.log('readProjectAndCalculatePrices: Final array with all data');

            /*console.log(idsAndQuantityArr);
            console.log(idsArrFSB_SB);*/
            checkArrayTypes();
            //console.log('readProjectAndCalculatePrices ',idsAndQuantityArr.length,",",idsArrFSB_SB.length);
            for (let i = 0; i < idsAndQuantityArr.length; i++)
            {
                //console.log('readProjectAndCalculatePrices i: '+i);
                let j = 0;
                for (j = 0; j < idsArrFSB_SB.length; j++)
                {
                    /*if(i==17 && j==185)
                    {
                      console.log("ids: "+idsAndQuantityArr[i].id,",",idsArrFSB_SB[j].productid);
                      console.log("idt: "+typeof idsAndQuantityArr[i].id,",",typeof idsArrFSB_SB[j].productid);
                    }*/
                    if (idsAndQuantityArr[i].id === idsArrFSB_SB[j].productid)
                    { 
                        let id = idsAndQuantityArr[i].id;
                        let quantity = Number(idsAndQuantityArr[i].value);
                        let unitPrice = Number(idsArrFSB_SB[j].euro);
                        //console.log("q: ",quantity,",",unitPrice);
                        let quantityTimesunitPrice = quantity * unitPrice;
                        let fullPrice = Number(quantityTimesunitPrice.toFixed(3));
                        arrOfAllElements.push({id, quantity, unitPrice, fullPrice});
                        break;
                    }
                }
                if(j==idsArrFSB_SB.length)
                {
                  //item is not found!!!
                  let errormsg="item is not found in priceList: " + idsAndQuantityArr[i].id;
                  console.log(errormsg);
                  errorList.push(errormsg);
                  throw errormsg;
                }
            }
            console.log('readProjectAndCalculatePrices: Final array with all data DONE');
            //console.log("arrOfAllElements.length: " + arrOfAllElements.length);

            //A lenti kod kiirja a fullPrice-ok osszeget. Az ugyfel szamara fizetendo teljes osszeg.
            //console.log('Total price');
            let sumFullPrice = 0;

            for (let i = 0; i < arrOfAllElements.length; i++)
            {
                sumFullPrice = sumFullPrice + arrOfAllElements[i].fullPrice;
            }
            sum.push(sumFullPrice.toFixed(3));
            console.log("Total Preis: " + sum + " €");
            return sum;
        })
    )
}

function checkArrayTypes()
{
  for (let i = 0; i < idsAndQuantityArr.length; i++)
  {
    if(typeof idsAndQuantityArr[i].id !== "string")
    {
      console.log("!", idsAndQuantityArr[i].id," is not string");
    }
  }
  for (let i = 0; i < idsArrFSB_SB.length; i++)
  {
    if(typeof idsArrFSB_SB[i].productid !== "string")
    {
      console.log("!", idsArrFSB_SB[i].productid," is not string");
    }
  }
}

/*
project("FSB.xlsx", "SB.xlsx", "Project.xlsx")
.then(mergedResult("Project.xlsx", "Result.xlsx"))
.catch(function(error) {
    console.log("catch: "+error);
    for(let i=0;i<errorList.length;i++)
    {
        console.log(errorList[i]);
    }
  });*/

function handleError(error)
{
    console.log("!!!!!!!!! handleError catch: "+error);
    for(let i=0;i<errorList.length;i++)
    {
        console.log(errorList[i]);
    }
    alert(errorList);
}

