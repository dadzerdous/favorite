// Color mastery and Flexible Mixing Buckets.
function colorXpNeeded(){return COLOR_PROFICIENCY_XP;}
function isMixedColor(color){return !!baseRecipes.concat(whiteRecipes).find(r=>r.result===color);}
function isColorProficient(color){return !!proficientColors[color];}
function addColorXp(color,amount){
  if(!color||!isMixedColor(color))return;
  amount=Math.max(0,Math.floor(amount||0)); if(!amount)return;
  colorXp[color]=(colorXp[color]||0)+amount;
  if(!proficientColors[color]&&colorXp[color]>=COLOR_PROFICIENCY_XP){
    proficientColors[color]=true;
    showMajorNotice("reward",`${colorInfo[color].label} is now proficient. You can use it in a Flexible Mixing Bucket.`,{title:`${colorInfo[color].label} Proficiency!`,icon:colorInfo[color].emoji});
  }
  saveState();
}
function recordColorMade(color){colorTimesMade[color]=(colorTimesMade[color]||0)+1;addColorXp(color,2);}
function proficientMixedColors(){return Object.keys(colorInfo).filter(c=>isMixedColor(c)&&isColorDiscovered(c)&&isColorProficient(c));}
function assignFlexibleBucket(index,color){if(index<0||index>=flexibleBucketCount||!isColorProficient(color))return;flexibleBucketColors[index]=color;renderFlexibleBuckets();saveState();}
function emptyFlexibleBucket(index){if(index<0||index>=flexibleBucketCount)return;flexibleBucketColors[index]=null;renderFlexibleBuckets();saveState();}
function renderFlexibleBuckets(){
  const field=document.querySelector("#field"); if(!field)return;
  field.querySelectorAll(".flexibleBucket").forEach(el=>el.remove());
  for(let index=0;index<flexibleBucketCount;index++){
    const color=flexibleBucketColors[index]||null,el=document.createElement("div");
    el.className="source flexibleBucket"; el.id=`flexibleBucket${index}`;
    if(color){el.dataset.color=color;el.innerHTML=`${colorInfo[color].emoji}<small>Tap</small>`;}
    else el.innerHTML=`🪣<small>Flexible</small>`;
    el.style.left=`${25+(index*20)}%`;el.style.top=`${38+(index%2)*22}%`;
    el.addEventListener("click",event=>{
      event.stopPropagation();
      if(!color){
        const choices=proficientMixedColors();
        if(!choices.length){say("Master a mixed color first");return;}
        const answer=prompt(`Choose a proficient color:\n${choices.map((c,i)=>`${i+1}. ${colorInfo[c].label}`).join("\n")}`);
        const choice=choices[Number(answer)-1]; if(choice)assignFlexibleBucket(index,choice); return;
      }
      if(sellMode){const earned=1+studioEarningsBonus;coins+=earned;totalSold++;pulseCoins(earned);playSellSound();renderAll();saveState();return;}
      tapSource(color,el);
    });
    el.addEventListener("dblclick",event=>{event.stopPropagation();if(color&&confirm(`Empty ${colorInfo[color].label} from this bucket?`))emptyFlexibleBucket(index);});
    field.appendChild(el);
  }
}
