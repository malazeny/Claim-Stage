
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
        const node = document.getElement("div");
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

