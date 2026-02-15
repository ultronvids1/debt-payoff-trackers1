
const questions=[
{q:"How much total debt do you have?",options:[
{text:"Under $5,000",type:"snowball"},
{text:"$5k-$25k",type:"snowball"},
{text:"$25k-$75k",type:"avalanche"},
{text:"Over $75k",type:"avalanche"}]},
{q:"Do you stay motivated long-term?",options:[
{text:"I lose motivation quickly",type:"snowball"},
{text:"I stay consistent",type:"avalanche"},
{text:"Depends on progress",type:"snowball"}]},
{q:"Is your income stable?",options:[
{text:"Very stable",type:"avalanche"},
{text:"Somewhat stable",type:"snowball"},
{text:"Unpredictable",type:"snowball"}]}
];

let step=0;
let score={snowball:0,avalanche:0};
const quizCard=document.getElementById("quizCard");

renderQuestion();

function renderQuestion(){
if(step>=questions.length){showEmailCapture();return;}
let current=questions[step];
quizCard.innerHTML="<h3>"+current.q+"</h3>";
current.options.forEach(opt=>{
let div=document.createElement("div");
div.className="option";
div.innerText=opt.text;
div.onclick=()=>{score[opt.type]++;step++;renderQuestion();};
quizCard.appendChild(div);
});
}

function showEmailCapture(){
let final=score.snowball>=score.avalanche?"snowball":"avalanche";
window.finalRecommendation=final;

quizCard.innerHTML=`
<h3>You're better suited for the ${final.toUpperCase()} method.</h3>
<p>Enter your email to unlock your personalized plan.</p>
<input type="email" id="userEmail" placeholder="Enter your email">
<br><br>
<button class="btn primary" onclick="unlock()">Unlock My Plan</button>
`;
}

function unlock(){
const email=document.getElementById("userEmail").value;
if(!email||!email.includes("@")){
alert("Please enter a valid email.");
return;
}

localStorage.setItem("leadEmail",email);
localStorage.setItem("recommendedMethod",window.finalRecommendation);
localStorage.setItem("quizCompleted","true");

window.location.href="index.html#tracker";
}
