/* SWASTHYA SENSE dashboard
   Frontend demonstration build: data is stored in this browser's localStorage.
   Connect these operations to your FastAPI/Supabase API before production use.
*/
const STORE_KEY = "swasthyaSenseDoctorDemo_v1";
const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const fmt = (date) => date ? new Date(date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const uid = (prefix) => prefix+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
const safe = (v) => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let state = loadState();
let doctorName = getDoctorName();

function loadState(){
  try { const raw=localStorage.getItem(STORE_KEY); if(raw) return JSON.parse(raw); } catch(e){}
  return {patients:[],checkins:[],referrals:[],reminders:[],activities:[],alerts:[],doctor:doctorNameFallback()};
}
function doctorNameFallback(){return "Doctor";}
function getDoctorName(){
  try{
    const user=JSON.parse(localStorage.getItem("doctorProfile")||"{}");
    return user.full_name||user.name||user.email?.split("@")[0]||"Doctor";
  }catch(e){return "Doctor";}
}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
function log(action,details){
  state.activities.unshift({id:uid("ACT"),action,details,actor:doctorName,at:new Date().toISOString()});
  state.activities=state.activities.slice(0,250); save();
}
function toast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);}
function patient(id){return state.patients.find(p=>p.id===id);}
function badge(status){const s=String(status||"Pending").toLowerCase().replace(/\s+/g,"-");return `<span class="badge ${safe(s)}">${safe(status||"Pending")}</span>`;}
function openModal(title,html,onSubmit){
  $("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modalBackdrop").classList.add("show");
  const form=$("modalBody").querySelector("form");
  if(form) form.addEventListener("submit",e=>{e.preventDefault();onSubmit(new FormData(form),form);});
}
function closeModal(){$("modalBackdrop").classList.remove("show");$("modalBody").innerHTML="";}
function field(label,name,type="text",value="",required=false,opts=""){
  if(type==="select") return `<div class="field"><label>${label}</label><select name="${name}" ${required?"required":""}>${opts}</select></div>`;
  return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${safe(value)}" ${required?"required":""}></div>`;
}
function patientOptions(selected=""){return state.patients.filter(p=>!p.inactive).map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${safe(p.name)} (${p.id})</option>`).join("");}
function showSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));
  document.querySelectorAll(".nav-link[data-target]").forEach(b=>b.classList.toggle("active",b.dataset.target===id));
  $("pageTitle").textContent=({dashboard:"Dashboard",patients:"Patients",checkins:"Patient check-ins",attention:"Attention engine",followups:"Follow-ups",referrals:"Referrals",reminders:"Reminders",reports:"Reports & analytics",audit:"Audit trail"})[id]||"Dashboard";
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-link[data-target]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.target)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.go)));
$("closeModal").onclick=closeModal;$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
$("todayLabel").textContent=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
$("doctorGreeting").textContent=doctorName;$("sidebarDoctorName").textContent=doctorName;$("sidebarInitials").textContent=doctorName.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();

function addPatientModal(existing=null){
  const p=existing||{};
  openModal(existing?"Edit patient":"Add patient",`<form><div class="form-grid">
    ${field("Full name","name","text",p.name||"",true)}${field("Age","age","number",p.age||"",true)}
    ${field("Category","category","select",p.category||"",true,["General","Pregnancy","Chronic","Post-illness"].map(x=>`<option ${p.category===x?"selected":""}>${x}</option>`).join(""))}
    ${field("Next follow-up","date","date",p.date||today(),true)}
    ${field("Follow-up status","status","select",p.status||"Pending",true,["Pending","Completed","Missed"].map(x=>`<option ${p.status===x?"selected":""}>${x}</option>`).join(""))}
    ${field("Phone number (demo)","phone","tel",p.phone||"")}
    ${field("Preferred language","language","select",p.language||"English",false,["English","Hindi","Marathi","Assamese"].map(x=>`<option ${p.language===x?"selected":""}>${x}</option>`).join(""))}
    ${field("Communication preference","communication","select",p.communication||"SMS",false,["SMS","WhatsApp","Phone call","No messages"].map(x=>`<option ${p.communication===x?"selected":""}>${x}</option>`).join(""))}
    <div class="field full"><label>Patient-reported notes</label><textarea name="notes">${safe(p.notes||"")}</textarea></div>
    <label class="checkline field full"><input type="checkbox" name="consent" ${p.consent?"checked":""}> Patient consent recorded for storing and using these details.</label>
  </div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">${existing?"Save changes":"Add patient"}</button></div></form>`,fd=>{
    const data=Object.fromEntries(fd.entries());data.age=Number(data.age);data.consent=fd.has("consent");data.inactive=false;
    if(!data.name.trim()||data.age<0||data.age>120){toast("Enter a valid name and age.");return;}
    if(existing){Object.assign(existing,data);log("Patient profile updated",existing.name);}else{
      const np={id:uid("SS"),...data,createdAt:new Date().toISOString(),contactAttempts:[],followupHistory:[{date:data.date,status:data.status,createdAt:new Date().toISOString()}]};
      state.patients.unshift(np);log("Patient registered",`${np.name} (${np.id})`);
    }
    save();closeModal();renderAll();toast(existing?"Patient updated":"Patient added successfully");
  });
}
$("addPatientTop").onclick=$("addPatientBtn").onclick=()=>addPatientModal();
function viewPatient(id){
  const p=patient(id);if(!p)return;
  const history=(p.followupHistory||[]).map(h=>`<div class="timeline-item"><b>${safe(h.status)} · ${fmt(h.date)}</b><small>${safe(h.note||"Follow-up record")}</small></div>`).join("")||"No history";
  const checks=state.checkins.filter(c=>c.patientId===id);
  openModal("Patient profile",`<div class="preview-box"><b>${safe(p.name)}</b> · ${safe(p.age)} years<br>${safe(p.category)} · ${safe(p.id)}<br>Next follow-up: ${fmt(p.date)}<br>Phone: ${safe(p.phone||"Not provided")}<br>Language: ${safe(p.language||"English")} · Consent: ${p.consent?"Recorded":"Not recorded"}<br><br>${safe(p.notes||"No patient notes entered.")}</div><h3 style="margin:18px 0 10px">Follow-up history</h3><div class="timeline">${history}</div><p class="muted">Check-ins recorded: ${checks.length}</p><div class="form-actions"><button class="btn btn-outline" onclick="editPatient('${id}')">Edit profile</button><button class="btn btn-outline" onclick="deactivatePatient('${id}')">${p.inactive?"Reactivate":"Deactivate"}</button><button class="btn btn-primary" onclick="closeModal()">Close</button></div>`);
}
function editPatient(id){const p=patient(id);closeModal();addPatientModal(p);}
function deactivatePatient(id){const p=patient(id);if(!p)return;p.inactive=!p.inactive;log(p.inactive?"Patient deactivated":"Patient reactivated",p.name);save();closeModal();renderAll();toast("Patient status updated");}
window.closeModal=closeModal;window.editPatient=editPatient;window.deactivatePatient=deactivatePatient;window.viewPatient=viewPatient;

function addCheckinModal(){
  if(!state.patients.length){toast("Add a patient first.");return;}
  openModal("Record patient check-in",`<form><div class="form-grid">
    ${field("Patient","patientId","select","",true,patientOptions())}
    ${field("Check-in date","date","date",today(),true)}
    ${field("Temperature (°C)","temperature","number","")}
    ${field("Blood pressure (as reported)","bp","text","")}
    ${field("Pulse (bpm)","pulse","number","")}
    ${field("Other measurement","measurement","text","")}
    <div class="field full"><label>Patient-reported concern / symptoms</label><textarea name="concern" placeholder="Record the patient's own words. This is not a diagnosis."></textarea></div>
    <label class="checkline field full"><input type="checkbox" name="consent" required> Patient consent confirmed for this check-in.</label>
  </div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save check-in</button></div></form>`,fd=>{
    const d=Object.fromEntries(fd.entries());d.consent=fd.has("consent");d.id=uid("CHK");d.createdAt=new Date().toISOString();
    const prev=state.checkins.filter(c=>c.patientId===d.patientId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
    d.comparison=prev?`Previous entry: ${prev.concern||"No concern recorded"}; temperature ${prev.temperature||"—"}°C`:"First check-in — no previous entry.";
    state.checkins.unshift(d);log("Patient check-in recorded",`${patient(d.patientId)?.name||"Patient"} · ${d.date}`);save();closeModal();renderAll();toast("Check-in saved");
  });
}
$("newCheckinBtn").onclick=addCheckinModal;
function renderCheckins(){
  $("checkinTable").innerHTML=state.checkins.map(c=>`<tr><td>${fmt(c.date)}</td><td><strong>${safe(patient(c.patientId)?.name||"Unknown")}</strong></td><td>${safe(c.concern||"—")}</td><td>Temp: ${safe(c.temperature||"—")}°C · BP: ${safe(c.bp||"—")} · Pulse: ${safe(c.pulse||"—")}</td><td>${safe(c.comparison)}</td><td>${c.consent?"Recorded":"Not recorded"}</td></tr>`).join("")||`<tr><td colspan="6" class="empty-state">No check-ins recorded.</td></tr>`;
}

function deriveAlerts(){
  const alerts=[];
  state.patients.filter(p=>!p.inactive).forEach(p=>{
    if(p.status!=="Completed"&&p.date&&p.date<today())alerts.push({id:"overdue-"+p.id,patientId:p.id,type:"overdue",title:"Overdue follow-up",rule:"FOLLOWUP_DATE_PASSED",reason:`The scheduled follow-up date (${fmt(p.date)}) has passed and the follow-up is not marked completed.`,priority:"Administrative",state:p.alertState||"Open"});
  });
  state.checkins.forEach(c=>{
    // Demo warning rules are intentionally simple, transparent, and configurable by clinical governance.
    const temp=Number(c.temperature);
    if(c.concern?.trim()||temp>=38){
      const p=patient(c.patientId);if(!p)return;
      const key="clinical-"+c.id;
      alerts.push({id:key,patientId:p.id,type:"clinical",title:"Patient-reported concern for review",rule:temp>=38?"TEMP_REPORTED_AT_OR_ABOVE_38C":"PATIENT_REPORTED_CONCERN_PRESENT",reason:temp>=38?`A temperature of ${temp}°C was entered in the check-in. Verify the measurement and review according to approved clinical protocol.`:"The patient entered a concern during check-in. Review the original patient-reported note and decide whether follow-up is needed.",priority:"Clinical review",state:state.alertStates?.[key]||"Open",checkinId:c.id});
    }
  });
  return alerts.filter(a=>a.state!=="Resolved");
}
function renderAlerts(){
  const alerts=deriveAlerts();$("navAlertCount").textContent=alerts.length;
  const html=alerts.map(a=>`<article class="alert-card ${a.type==="clinical"?"clinical":""}"><h3>${safe(a.title)} · ${safe(patient(a.patientId)?.name||"Unknown patient")}</h3><div class="alert-meta">${safe(a.priority)} · Rule: ${safe(a.rule)} · ${safe(a.state)}</div><p><b>Why this appeared:</b> ${safe(a.reason)}</p><p><b>Next step:</b> A qualified team member should review the record and document the outcome.</p><div class="alert-actions"><button class="mini-btn" onclick="ackAlert('${a.id}')">Acknowledge</button><button class="mini-btn" onclick="resolveAlert('${a.id}')">Resolve</button><button class="mini-btn" onclick="viewPatient('${a.patientId}')">View patient</button>${a.type==="overdue"?`<button class="mini-btn" onclick="reschedule('${a.patientId}')">Reschedule</button>`:""}</div></article>`).join("");
  $("fullAttentionList").innerHTML=html||`<div class="panel empty-state">No active alerts. All tracked cases are up to date.</div>`;
  $("attentionList").innerHTML=alerts.slice(0,4).map(a=>`<div class="list-item"><div><b>${safe(a.title)}</b><small>${safe(patient(a.patientId)?.name||"Unknown")} · ${safe(a.priority)}</small></div>${badge(a.type==="clinical"?"Review":"Pending")}</div>`).join("")||"No active alerts.";
}
function ackAlert(id){state.alertStates=state.alertStates||{};state.alertStates[id]="Acknowledged";const a=deriveAlerts().find(x=>x.id===id);if(a){a.ackAt=new Date().toISOString();state.alertStates[id]="Acknowledged";}log("Alert acknowledged",id);save();renderAll();toast("Alert acknowledged");}
function resolveAlert(id){state.alertStates=state.alertStates||{};state.alertStates[id]="Resolved";log("Alert resolved",id);save();renderAll();toast("Alert marked resolved");}
function reschedule(id){const p=patient(id);if(!p)return;openModal("Reschedule follow-up",`<form><div class="form-grid">${field("New follow-up date","date","date",p.date>today()?p.date:today(),true)}${field("Contact attempt note","note","text","")}</div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save schedule</button></div></form>`,fd=>{const d=Object.fromEntries(fd.entries());p.date=d.date;p.status="Pending";p.followupHistory=p.followupHistory||[];p.followupHistory.unshift({date:d.date,status:"Rescheduled",note:d.note||"Follow-up rescheduled",createdAt:new Date().toISOString()});if(d.note){p.contactAttempts=p.contactAttempts||[];p.contactAttempts.push({date:new Date().toISOString(),note:d.note});}log("Follow-up rescheduled",`${p.name} · ${d.date}`);save();closeModal();renderAll();toast("Follow-up rescheduled");});}
window.ackAlert=ackAlert;window.resolveAlert=resolveAlert;window.reschedule=reschedule;

function renderPatients(){
  const q=($("patientSearch")?.value||"").toLowerCase(),cat=$("patientCategoryFilter")?.value||"",st=$("patientStatusFilter")?.value||"";
  const rows=state.patients.filter(p=>(!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q))&&(!cat||p.category===cat)&&(!st||(st==="Inactive"?p.inactive:p.status===st)));
  $("patientTable").innerHTML=rows.map(p=>`<tr><td><strong>${safe(p.name)}</strong><small>${safe(p.id)} ${p.inactive?"· Inactive":""}</small></td><td>${safe(p.age)}</td><td>${safe(p.category)}</td><td>${fmt(p.date)}</td><td>${badge(p.inactive?"Inactive":p.status)}</td><td><div class="actions"><button class="mini-btn" onclick="viewPatient('${p.id}')">View</button><button class="mini-btn" onclick="editPatient('${p.id}')">Edit</button><button class="mini-btn" onclick="completeFollowup('${p.id}')">Complete</button></div></td></tr>`).join("")||`<tr><td colspan="6" class="empty-state">No matching patients. Add a patient to begin.</td></tr>`;
}
["patientSearch","patientCategoryFilter","patientStatusFilter"].forEach(id=>$(id).addEventListener("input",renderPatients));
function completeFollowup(id){const p=patient(id);if(!p)return;p.status="Completed";p.followupHistory=p.followupHistory||[];p.followupHistory.unshift({date:p.date,status:"Completed",note:"Follow-up marked complete",createdAt:new Date().toISOString()});log("Follow-up completed",p.name);save();renderAll();toast("Follow-up completed");}
window.completeFollowup=completeFollowup;
function renderFollowups(){
  const filter=$("followupFilter").value;
  const rows=state.patients.filter(p=>!p.inactive&&(!filter||p.status===filter));
  $("followupTable").innerHTML=rows.map(p=>`<tr><td><strong>${safe(p.name)}</strong></td><td>${safe(p.id)}</td><td>${fmt(p.date)}</td><td>${badge(p.status)}</td><td>${(p.contactAttempts||[]).length}</td><td><div class="actions"><button class="mini-btn" onclick="completeFollowup('${p.id}')">Complete</button><button class="mini-btn" onclick="reschedule('${p.id}')">Reschedule</button><button class="mini-btn" onclick="contactAttempt('${p.id}')">Log contact</button></div></td></tr>`).join("")||`<tr><td colspan="6" class="empty-state">No follow-ups found.</td></tr>`;
}
$("followupFilter").onchange=renderFollowups;
function contactAttempt(id){const p=patient(id);openModal("Log contact attempt",`<form><div class="form-grid">${field("Contact method","method","select","Phone call",true,["Phone call","SMS","WhatsApp","In person"].map(x=>`<option>${x}</option>`).join(""))}<div class="field full"><label>Outcome / notes</label><textarea name="note" required></textarea></div></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save attempt</button></div></form>`,fd=>{const d=Object.fromEntries(fd.entries());p.contactAttempts=p.contactAttempts||[];p.contactAttempts.push({...d,date:new Date().toISOString()});log("Contact attempt logged",`${p.name} · ${d.method}`);save();closeModal();renderAll();toast("Contact attempt saved");});}
window.contactAttempt=contactAttempt;
$("scheduleFollowupBtn").onclick=()=>{if(!state.patients.length){toast("Add a patient first.");return;}openModal("Schedule follow-up",`<form><div class="form-grid">${field("Patient","patientId","select","",true,patientOptions())}${field("Follow-up date","date","date",today(),true)}</div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Schedule</button></div></form>`,fd=>{const d=Object.fromEntries(fd.entries()),p=patient(d.patientId);p.date=d.date;p.status="Pending";p.followupHistory=p.followupHistory||[];p.followupHistory.unshift({date:d.date,status:"Scheduled",createdAt:new Date().toISOString()});log("Follow-up scheduled",`${p.name} · ${d.date}`);save();closeModal();renderAll();toast("Follow-up scheduled");});};

function createReferral(){
  if(!state.patients.length){toast("Add a patient first.");return;}
  openModal("Create referral",`<form><div class="form-grid">${field("Patient","patientId","select","",true,patientOptions())}${field("Referred to / facility","facility","text","",true)}${field("Assigned staff member","assignee","text",doctorName)}${field("Status","status","select","Open",true,["Open","In progress","Closed"].map(x=>`<option>${x}</option>`).join(""))}<div class="field full"><label>Referral reason</label><textarea name="reason" required></textarea></div><div class="field full"><label>Outcome (optional)</label><textarea name="outcome"></textarea></div></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Create referral</button></div></form>`,fd=>{const d=Object.fromEntries(fd.entries());state.referrals.unshift({id:uid("REF"),...d,createdAt:new Date().toISOString(),ackAt:null,closedAt:d.status==="Closed"?new Date().toISOString():null});log("Referral created",`${patient(d.patientId)?.name} → ${d.facility}`);save();closeModal();renderAll();toast("Referral created");});
}
$("newReferralBtn").onclick=createReferral;
function updateReferral(id){
  const r=state.referrals.find(x=>x.id===id);if(!r)return;
  openModal("Update referral",`<form><div class="form-grid">${field("Assigned staff member","assignee","text",r.assignee||"")}${field("Status","status","select",r.status,true,["Open","In progress","Closed"].map(x=>`<option ${r.status===x?"selected":""}>${x}</option>`).join(""))}<div class="field full"><label>Referral outcome / notes</label><textarea name="outcome">${safe(r.outcome||"")}</textarea></div></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save update</button></div></form>`,fd=>{const d=Object.fromEntries(fd.entries());Object.assign(r,d);if(d.status==="Closed"&&!r.closedAt)r.closedAt=new Date().toISOString();if(d.status!=="Closed")r.closedAt=null;log("Referral updated",`${r.id} · ${r.status}`);save();closeModal();renderAll();toast("Referral updated");});
}
window.updateReferral=updateReferral;
function renderReferrals(){
  const rows=state.referrals;
  const html=rows.map(r=>`<tr><td><strong>${safe(patient(r.patientId)?.name||"Unknown")}</strong><small>${safe(r.patientId)}</small></td><td>${safe(r.facility)}</td><td>${safe(r.reason)}</td><td>${safe(r.assignee||"Unassigned")}</td><td>${badge(r.status)}</td><td>${safe(r.outcome||"Pending")}</td><td><button class="mini-btn" onclick="updateReferral('${r.id}')">Update / reassign</button></td></tr>`).join("");
  $("fullReferralList").innerHTML=html||`<tr><td colspan="7" class="empty-state">No referrals created.</td></tr>`;
  $("referralList").innerHTML=rows.filter(r=>r.status!=="Closed").slice(0,4).map(r=>`<div class="list-item"><div><b>${safe(patient(r.patientId)?.name||"Unknown")}</b><small>${safe(r.facility)} · ${safe(r.assignee||"Unassigned")}</small></div>${badge(r.status)}</div>`).join("")||"No open referrals.";
}

function createReminder(){
  if(!state.patients.length){toast("Add a patient first.");return;}
  openModal("Create reminder",`<form><div class="form-grid">${field("Patient","patientId","select","",true,patientOptions())}${field("Channel","channel","select","SMS",true,["SMS","WhatsApp"].map(x=>`<option>${x}</option>`).join(""))}${field("Schedule date","date","date",today(),true)}${field("Schedule time","time","time","09:00",true)}<div class="field full"><label>Message</label><textarea name="message" required>Reminder: You have a follow-up appointment scheduled. Please contact your healthcare provider if you need to reschedule.</textarea></div></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Preview reminder</button></div></form>`,fd=>{const d=Object.fromEntries(fd.entries());const p=patient(d.patientId);openModal("Confirm reminder preview",`<div class="preview-box"><b>${safe(d.channel)} preview for ${safe(p.name)}</b><br><br>${safe(d.message)}<br><br><small>Scheduled: ${safe(d.date)} at ${safe(d.time)}. This is a simulated reminder only.</small></div><div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="confirmReminder">Save reminder</button></div>`);$("confirmReminder").onclick=()=>{state.reminders.unshift({id:uid("MSG"),...d,status:"Scheduled",createdAt:new Date().toISOString()});log("Reminder scheduled",`${p.name} · ${d.channel}`);save();closeModal();renderAll();toast("Reminder saved in demo history");};});
}
$("newReminderBtn").onclick=createReminder;
function renderReminders(){
  $("reminderTable").innerHTML=state.reminders.map(r=>`<tr><td><strong>${safe(patient(r.patientId)?.name||"Unknown")}</strong></td><td>${safe(r.channel)}</td><td>${safe(r.message)}</td><td>${fmt(r.date)} · ${safe(r.time)}</td><td>${badge(r.status)}</td><td><button class="mini-btn" onclick="markReminderSent('${r.id}')">Mark sent</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty-state">No reminders scheduled.</td></tr>`;
}
function markReminderSent(id){const r=state.reminders.find(x=>x.id===id);if(!r)return;r.status="Sent (simulated)";log("Reminder marked sent (simulated)",r.id);save();renderAll();toast("Updated reminder status");}
window.markReminderSent=markReminderSent;

function renderDashboard(){
  const active=state.patients.filter(p=>!p.inactive),alerts=deriveAlerts(),overdue=alerts.filter(a=>a.type==="overdue").length,clinical=alerts.filter(a=>a.type==="clinical").length;
  const done=active.filter(p=>p.status==="Completed").length,completion=active.length?Math.round(done/active.length*100):0;
  const refsOpen=state.referrals.filter(r=>r.status!=="Closed").length,closed=state.referrals.filter(r=>r.status==="Closed").length;
  $("totalPatients").textContent=active.length;$("todayAppointments").textContent=active.filter(p=>p.date===today()&&p.status!=="Completed").length;$("queueCount").textContent=active.filter(p=>p.status==="Pending").length;$("overdueCount").textContent=overdue;$("clinicalCount").textContent=clinical;$("completionRate").textContent=completion+"%";$("openReferrals").textContent=refsOpen;
  $("analyticsCompletion").textContent=completion+"%";$("completionBar").style.width=completion+"%";$("analyticsOverdue").textContent=overdue;$("analyticsReviews").textContent=clinical;$("analyticsReferrals").textContent=closed;
  $("reportPatients").textContent=active.length;$("reportOverdue").textContent=overdue;$("reportCompletion").textContent=completion+"%";$("reportClosed").textContent=closed;$("missedReport").textContent=active.filter(p=>p.status==="Missed").length;
  const filtered=alerts.filter(a=>{const p=patient(a.patientId);return (!$("dashboardCategory").value||p?.category===$("dashboardCategory").value)&&(!$("dashboardAlert").value||a.type===$("dashboardAlert").value)&&(!$("dashboardStatus").value||p?.status===$("dashboardStatus").value);});
  $("attentionList").innerHTML=filtered.slice(0,5).map(a=>`<div class="list-item"><div><b>${safe(a.title)}</b><small>${safe(patient(a.patientId)?.name||"Unknown")} · ${safe(a.reason)}</small></div>${badge(a.type==="clinical"?"Review":"Pending")}</div>`).join("")||"No active alerts match these filters.";
  const appts=active.filter(p=>p.date===today()&&p.status!=="Completed");
  $("appointmentList").innerHTML=appts.map(p=>`<div class="list-item"><div><b>${safe(p.name)}</b><small>${safe(p.category)} · ${safe(p.id)}</small></div><button class="mini-btn" onclick="viewPatient('${p.id}')">View</button></div>`).join("")||"No appointments scheduled for today.";
  $("aiBrief").textContent=`There are ${active.length} active patient records, ${overdue} overdue follow-ups, ${clinical} check-in entries flagged for review, and ${refsOpen} open referrals. ${active.filter(p=>p.status==="Pending").length} patients are awaiting follow-up. This summary is generated from recorded dashboard data; it is not a clinical assessment.`;
}
["dashboardCategory","dashboardAlert","dashboardStatus"].forEach(id=>$(id).addEventListener("change",renderDashboard));
function renderTimeline(){
  $("timeline").innerHTML=state.activities.slice(0,7).map(a=>`<div class="timeline-item"><b>${safe(a.action)}</b><small>${safe(a.details)} · ${new Date(a.at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</small></div>`).join("")||"No activity recorded.";
  $("auditList").innerHTML=state.activities.map(a=>`<tr><td>${new Date(a.at).toLocaleString()}</td><td>${safe(a.actor)}</td><td>${safe(a.action)}</td><td>${safe(a.details)}</td></tr>`).join("")||`<tr><td colspan="4" class="empty-state">No audit entries.</td></tr>`;
}
function renderReports(){
  const counts=["Pending","Completed","Missed"].map(s=>({s,n:state.patients.filter(p=>!p.inactive&&p.status===s).length})),max=Math.max(1,...counts.map(x=>x.n));
  $("statusChart").innerHTML=counts.map(x=>`<div class="bar-line"><span>${x.s}</span><div class="bar-track"><i style="width:${x.n/max*100}%"></i></div><b>${x.n}</b></div>`).join("");
  const ackTimes=Object.values(state.alertStates||{}).filter(x=>x==="Acknowledged").length;
  $("avgAck").textContent=ackTimes?"Acknowledged alerts: "+ackTimes:"No acknowledgements";
  const completed=state.referrals.filter(r=>r.closedAt&&r.createdAt);
  if(completed.length){const avg=completed.reduce((s,r)=>s+(new Date(r.closedAt)-new Date(r.createdAt))/86400000,0)/completed.length;$("avgReferral").textContent=avg.toFixed(1)+" days";}else $("avgReferral").textContent="No closed referrals";
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);days.push({key,label:d.toLocaleDateString("en-US",{weekday:"short"}),n:state.patients.filter(p=>(p.followupHistory||[]).some(h=>h.status==="Completed"&&h.date===key)).length});}
  const maxTrend=Math.max(1,...days.map(x=>x.n));$("trendChart").innerHTML=days.map(x=>`<div class="trend-col"><i style="height:${Math.max(4,x.n/maxTrend*100)}%"></i><small>${x.label}</small></div>`).join("");
}
function renderAll(){renderDashboard();renderPatients();renderCheckins();renderAlerts();renderFollowups();renderReferrals();renderReminders();renderTimeline();renderReports();}
$("ruleInfoBtn").onclick=()=>openModal("About attention rules",`<div class="preview-box"><b>Overdue follow-up</b><br>Rule: FOLLOWUP_DATE_PASSED. Triggered when the scheduled date is earlier than today and the record is not completed.<br><br><b>Patient-reported concern</b><br>Triggered when a check-in contains a concern note or a temperature value at or above 38°C. This is a demo flag only; staff must verify the entry and follow approved clinical protocols.<br><br>Only clinician-approved and validated rules should be used in a real healthcare deployment. These rules do not diagnose or prescribe.</div><div class="form-actions"><button class="btn btn-primary" onclick="closeModal()">Close</button></div>`);
$("viewReferralsBtn").onclick=()=>showSection("referrals");
$("exportBtn").onclick=()=>{
  const rows=[["Patient ID","Name","Age","Category","Next follow-up","Status","Phone","Consent"],...state.patients.map(p=>[p.id,p.name,p.age,p.category,p.date,p.status,p.phone||"",p.consent?"Yes":"No"])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="swasthya-sense-patients.csv";a.click();URL.revokeObjectURL(url);log("Patient report exported","CSV patient registry");save();renderTimeline();toast("CSV exported");
};
$("clearAuditBtn").onclick=()=>{if(confirm("Clear the demo audit history?")){state.activities=[];save();renderTimeline();toast("Demo audit log cleared");}};
// LOGOUT BUTTON
$("logoutBtn").onclick = async () => {
    const confirmLogout = confirm("Are you sure you want to log out?");

    if (!confirmLogout) return;

    try {
        // Sign out from Supabase if available
        if (typeof supabaseClient !== "undefined") {
            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                console.error("Logout error:", error.message);
            }
        }

        // Return to the login/signup page
        window.location.href = "index.html";

    } catch (error) {
        console.error("Logout failed:", error);
        window.location.href = "index.html";
    }
};
renderAll();