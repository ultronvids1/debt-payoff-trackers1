
window.addEventListener("DOMContentLoaded",function(){
const method=localStorage.getItem("recommendedMethod");
if(method){
document.getElementById("tracker").hidden=false;
document.getElementById("methodSelect").value=method;
document.getElementById("tracker").scrollIntoView({behavior:"smooth"});
}
});

let debts=[];

function addDebt(){
let name=document.getElementById("debtName").value;
let balance=parseFloat(document.getElementById("debtBalance").value);
let min=parseFloat(document.getElementById("debtMin").value);
let rate=parseFloat(document.getElementById("debtRate").value);

if(!name||!balance||!min||!rate){alert("Fill all fields");return;}

debts.push({name,balance,min,rate});
renderDebts();
}

function renderDebts(){
let list=document.getElementById("debtList");
list.innerHTML="";
debts.forEach(d=>{
let li=document.createElement("li");
li.innerText=d.name+" - $"+d.balance+" @ "+d.rate+"%";
list.appendChild(li);
});
}
