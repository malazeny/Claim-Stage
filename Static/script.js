
let claims = [];
const cloud = document.getElementById("claim-cloud");
const steps = document.querySelectorAll(".step");
const claimList = document.getElementById("claim-list");

const topicColors = {
    "Election fraud": "#1d4e89", 
    "Immigration": "#c1121f",
    "COVID-19": "#171717",
    "Economy": "#e5ad2c"
};

fetch("/api/claims")
    .then( r => r.json())
    .then(data =>{
        claims = data.map((c,index) => ({
            ...c, 
            year:new Date(c.date).getFullYear(),
            id:index
        }));

        createNodes();
        updateStage("scatter");
        renderArchive();
        setupScroll();
        setupInteractiveMachineControls();
    });

function createNodes(){

    cloud.innerHTML = "";

    claims.forEach((claim, index) => {
        const node = document.createElement("div");
        node.className = "claim-node";

        node.innerHTML = `
        <strong>${claim.topic}</strong><br>
        ${claim.claim.slice(0, 65)}...
    `;
    
        node.style.borderLeft = `6px solid ${topicColors[claim.topic]}`;

        node.dataset.index = index;
        cloud.appendChild(node);
    });
}

function updateStage(mode){
    const nodes = [...document.querySelectorAll(".claim-node")];

    const width = cloud.clientWidth;
    const height = cloud.clientHeight;

    nodes.forEach((node, i) => {
        const claim = claims[i];

        let x = 0;
        let y = 0;

        if(mode === "scatter"){
            x = random(i * 3) * (width - 160);
            y = random(i * 7) * (height - 100);
        }

        if(mode === "topics"){

            const map = {
                "Election fraud": 0,
                "Immigration": 1,
                "COVID-19": 2,
                "Economy": 3
            };

            const col = map[claim.topic];
            x = 40 + col * (width / 4);
            y = 80 + (i % 5) *90;
        }

        if(mode === "sources"){
            const map = {
                "Tweet":0,
                "Speech":1,
                "Interview":2,
                "Debate":3
            };

            const col = map[claim.sourceType] || 0;

            x = 40 + col * (width / 4);
            y = 60 + (i % 6) * 82;

            node.style.width = "150px";
        }

        if(mode === "timeline"){
            
            x = ((claim.year - 2016) / 4) * (width -180);
            y = 100 + (i % 5) * 95;
        }

        if(mode === "archive"){
            x = (i % 2) * 240 +70;
            y = Math.floor(i / 2) * 90 +50;

            node.style.width = "190px";
        }

        node.style.transform = `
        translate(${x}px, ${y}px)
        rotate(${random(i * 9) * 10 - 5}deg)
      `;
    });
  }

function setupScroll(){

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                steps.forEach(step => step.classList.remove("active"));
                entry.target.classList.add("active");

                const mode = entry.target.dataset.step;
                updateStage(mode);
            }
        });
    }, {
        threshold:0.55
    });

    steps.forEach(step => observer.observe(step));
}

  function renderArchive(){

    claimList.innerHTML = claims.map(claim => `
        <article class="claim-card">
            <div class="claim-card-top">
                <span class="topic">${claim.topic}</span>
                <span>${claim.date}</span>
            </div>
    
            <h3>"${claim.claim}"</h3>
            <p>${claim.explanation}</p>
        </article>
    `).join("");
  }

function random(seed){
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
}

let machineTopic = "All";
let machineSource = "All";
let machineYear = "All";
let machineShuffleSeed = 1;

const interactiveMachine = document.getElementById("interactive-machine");
const machineVisibleCount = document.getElementById("machine-visible-count");
const machineSourceSelect = document.getElementById("machine-source");
const machineYearSlider = document.getElementById("machine-year");
const machineYearLabel = document.getElementById("machine-year-label");

function machineFilteredClaims(){
    return claims.filter(claim => {
        const topicMatch = machineTopic === "All" || claim.topic === machineTopic; 
        const sourceMatch = machineSource === "All"|| claim.sourceType === machineSource; 
        const yearMatch = machineYear === "All" || claim.year === Number(machineYear);
        return topicMatch && sourceMatch && yearMatch;
    });
}