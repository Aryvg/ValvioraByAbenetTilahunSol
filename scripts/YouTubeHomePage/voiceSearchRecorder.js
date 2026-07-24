export function createRecorder(onDone) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
        alert('Voice search is not supported in this browser.');
        return null;
    }
    const overlay = document.createElement('div');
    overlay.className = 'voice-record-overlay';
    overlay.innerHTML = `
        <div class="voice-record-card" role="dialog" aria-modal="true">
            <div class="voice-header">Listening… <span class="voice-dot"></span></div>
            <div class="voice-transcript" aria-live="polite"></div>
            <div class="voice-controls">
                <button class="voice-cancel">Cancel</button>
                <button class="voice-done" style="display:none">Done</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const transcriptEl = overlay.querySelector('.voice-transcript');
    const doneBtn = overlay.querySelector('.voice-done');
    const cancelBtn = overlay.querySelector('.voice-cancel');

    const rec = new SpeechRec();
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = '';
    let lastResultAt = Date.now();
    let silenceTimer = null;

    function startSilenceWatcher() {
        if (silenceTimer) clearInterval(silenceTimer);
        silenceTimer = setInterval(()=>{
            if (Date.now() - lastResultAt >= 3000) {
                doneBtn.style.display = 'inline-flex';
                overlay.querySelector('.voice-header').textContent = 'Paused — click Done or speak more';
                try { rec.stop(); } catch(e){}
                clearInterval(silenceTimer);
            }
        }, 400);
    }

    rec.onresult = (ev) => {
        lastResultAt = Date.now();
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            if (r.isFinal) finalText += r[0].transcript;
            else interim += r[0].transcript;
        }
        transcriptEl.textContent = (finalText + ' ' + interim).trim();
        startSilenceWatcher();
    };
    rec.onerror = () => { overlay.remove(); };
    rec.onend = () => {
        doneBtn.style.display = 'inline-flex';
        overlay.querySelector('.voice-header').textContent = 'Paused — click Done or speak more';
    };

    cancelBtn.addEventListener('click', ()=>{ rec.stop(); overlay.remove(); });
    doneBtn.addEventListener('click', ()=>{
        rec.stop();
        overlay.remove();
        onDone((finalText + ' ' + transcriptEl.textContent).trim());
    });

    try { rec.start(); } catch(e){ /* ignore */ }
    return overlay;
}

export function handleVoiceClick(e) {
    e.stopPropagation();
    const field = document.querySelector('.js-search-input') || document.querySelector('.js-full-search');
    if (!field) return;
    createRecorder((text)=>{
        if (!text) return;
        field.value = text;
        const ev = new KeyboardEvent('keydown', {key:'Enter'});
        field.dispatchEvent(ev);
    });
}

export function setupVoiceSearchButtons() {
    document.querySelectorAll('.voice-search-button').forEach(btn => btn.addEventListener('click', handleVoiceClick));
}
