
let claims = [];
let visualClaims = [];
const cloud = document.getElementById("claim-cloud");
const steps = document.querySelectorAll(".step");
const claimList = document.getElementById("claim-list");

const topicColors = {
    "Election Fraud": "#1d4e89", 
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

    visualClaims = shuffleClaims(getBalancedClaims(15));

    visualClaims.forEach((claim, index) => {
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

    const topicCount = {};
    const sourceCount = {};
    const yearCount = {};

    const years = [...new Set(visualClaims.map(claim => claim.year))].sort();

    nodes.forEach((node, i) => {

        const claim = visualClaims[i];

        if (!claim) return;

        let x = 0;
        let y = 0;

        node.style.width = "120px";

        if(mode === "scatter"){

            x = random(i * 3) * (width - 160);
            y = random(i * 7) * (height - 100);
        }

        if(mode === "topics"){

            const map = {
                "Election Fraud": 0,
                "Immigration": 1,
                "COVID-19": 2,
                "Economy": 3
            };

            const col = map[claim.topic];

            topicCount[claim.topic] = (topicCount[claim.topic] || 0) + 1;

            const row = topicCount[claim.topic] - 1;

            x = 40 + col * ((width - 200) / 4);
            y = 50 + row * 72;
        }

        if(mode === "sources"){

            const map = {
                "Tweet": 0,
                "Speech": 1,
                "Interview": 2,
                "Debate": 3,
                "Vlog": 3
            };

            const col = map[claim.sourceType] || 0;

            sourceCount[claim.sourceType] =
                (sourceCount[claim.sourceType] || 0) + 1;

            const row = sourceCount[claim.sourceType] - 1;

            x = 40 + col * ((width - 200) / 4);
            y = 50 + row * 72;

            node.style.width = "135px";
        }

        if(mode === "timeline"){

            const yearIndex = years.indexOf(claim.year);

            yearCount[claim.year] =
                (yearCount[claim.year] || 0) + 1;

            const row = yearCount[claim.year] - 1;

            x = 40 + yearIndex * ((width - 200) / years.length);
            y = 50 + row * 72;

            node.style.width = "135px";
        }

        if(mode === "archive"){

            const col = i % 3;
            const row = Math.floor(i / 3);

            x = 40 + col * 220;
            y = 50 + row * 90;

            node.style.width = "180px";
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

    const archiveClaims = getBalancedClaims(6);

    claimList.innerHTML = archiveClaims.map(claim => `
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

function getBalancedClaims(limitPerTopic = 15) {
    const topics = ["Election Fraud", "Immigration", "COVID-19", "Economy"];
    let balanced = [];

    topics.forEach(topic => {
        const topicClaims = claims
            .filter(claim => claim.topic === topic)
            .slice(0, limitPerTopic);

        balanced = balanced.concat(topicClaims);
    });

    return balanced;
}

function shuffleClaims(array) {
    return [...array].sort((a, b) => random(a.id) - random(b.id));
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

function renderInteractiveMachine(){
    if(!interactiveMachine || !claims.length) return;

    const data = machineTopic === "All"
        ? getBalancedClaims(20)
        : machineFilteredClaims().slice(0, 80);
    machineVisibleCount.textContent = `${data.length} visible`;

    interactiveMachine.innerHTML = data.map((claim, index) => {
        const pos = machinePosition(index, claim);
        const color = topicColors[claim.topic] || "#c1121f";

        return `
            <article
                class="machine-slip"
                style="--x:${pos.x}px; --y:${pos.y}px; --r:${pos.r}deg; --topic-color:${color};"
                title="${escapeHTML(claim.claim)}"
            >
                <strong>${claim.topic} · ${claim.year}</strong>
                ${escapeHTML(claim.claim)}
            </article>
            `;
    }).join("");
}

function machinePosition(index, claim){
    const width = interactiveMachine.clientWidth || 900;
    const columns = Math.max(2, Math.floor(width / 210));
    const row = Math.floor(index / columns);
    const column = index % columns;

    const jitterX = random(index + machineShuffleSeed + claim.year) * 34 - 17;
    const jitterY = random(index * 3 + machineShuffleSeed + claim.id) * 32 -16;

    return{
        x: 24 + column * ((width - 240) / Math.max(columns - 1, 1)) + jitterX,
        y: 28 + row * 105 + jitterY,
        r: Math.round(random(index + machineShuffleSeed * 2) * 10 -5)
    };
}

function setupInteractiveMachineControls(){
    if(!interactiveMachine) return;

    const years = [...new Set(claims.map(claim => claim.year))].sort();

    machineYearSlider.min = years[0];
    machineYearSlider.max = years[years.length - 1]; 
    machineYearSlider.value = years[years.length - 1];

    document.querySelectorAll(".machine-topic").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".machine-topic").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            machineTopic = button.dataset.topic; 
            renderInteractiveMachine();
        });
    });

    machineSourceSelect.addEventListener("change", () => {
        machineSource = machineSourceSelect.value;
        renderInteractiveMachine();
    });

    machineYearSlider.addEventListener("input", () => {
        machineYear = machineYearSlider.value; 
        machineYearLabel.textContent = machineYear; 
        renderInteractiveMachine();
    });

    document.getElementById("machine-shuffle").addEventListener("click", () => {
        machineShuffleSeed += 1; 
        renderInteractiveMachine();
    });

    document.getElementById("machine-reset").addEventListener("click", () => {
        machineTopic = "All";
        machineSource = "All";
        machineYear = "All"; 
        machineShuffleSeed += 1;

        document.querySelectorAll(".machine-topic").forEach(btn => btn.classList.remove("active"));
        document.querySelector('.machine-topic[data-topic="All"]').classList.add("active");

        machineSourceSelect.value = "All";
        machineYearSlider.value = years[years.length - 1];
        machineYearLabel.textContent = "All years";

        renderInteractiveMachine();
    });
}

function escapeHTML(value){
    return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

window.addEventListener("resize", renderInteractiveMachine)