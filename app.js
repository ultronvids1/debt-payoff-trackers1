
const questions=[
{q:"Roughly how much total debt do you have?", options:[
{text:"Under $5,000", type:"snowball"},
{text:"$5k - $25k", type:"snowball"},
{text:"$25k - $75k", type:"avalanche"},
{text:"Over $75k", type:"avalanche"}]},

{q:"Do you usually stay motivated when working toward long-term goals?", options:[
{text:"I lose motivation quickly", type:"snowball"},
{text:"I stay consistent", type:"avalanche"},
{text:"Depends on progress", type:"snowball"}]},

{q:"Is your income stable?", options:[
{text:"Very stable", type:"avalanche"},
{text:"Somewhat stable", type:"snowball"},
{text:"Unpredictable", type:"snowball"}]},

{q:"What matters more to you?", options:[
{text:"Quick wins and momentum", type:"snowball"},
{text:"Saving the most money long term", type:"avalanche"}]}
];

let step=0;
let score={snowball:0,avalanche:0};

const intro=document.getElementById("quizIntro");
const quiz=document.getElementById("quizSection");
const result=document.getElementById("resultSection");
const tracker=document.getElementById("tracker");
const questionContainer=document.getElementById("questionContainer");
const progressBar=document.getElementById("progressBar");

document.getElementById("startQuiz").onclick=()=>{
intro.hidden=true;
quiz.hidden=false;
renderQuestion();
};

function renderQuestion(){
progressBar.style.width=((step)/questions.length*100)+"%";
if(step>=questions.length){showResult();return;}
let current=questions[step];
questionContainer.innerHTML="<h3>"+current.q+"</h3>";
current.options.forEach(opt=>{
let div=document.createElement("div");
div.className="option";
div.innerText=opt.text;
div.onclick=()=>{
score[opt.type]++;
step++;
renderQuestion();
};
questionContainer.appendChild(div);
});
}

function showResult(){
quiz.hidden=true;
result.hidden=false;
let final=score.snowball>=score.avalanche?"snowball":"avalanche";
document.getElementById("resultTitle").innerText="You're better suited for the "+final.toUpperCase()+" method.";
document.getElementById("resultText").innerText=
final==="snowball"?
"You'll benefit from quick wins and building momentum. Paying off smaller debts first will keep you encouraged.":
"You’re disciplined and benefit from minimizing interest. Paying highest rates first saves you money.";
window.finalRecommendation=final;
}

function applyResult(){
result.hidden=true;
tracker.hidden=false;
document.getElementById("methodSelect").value=window.finalRecommendation;
tracker.scrollIntoView({behavior:"smooth"});
}
