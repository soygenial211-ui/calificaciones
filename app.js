document.addEventListener('DOMContentLoaded', () => {
    const groupSelect = document.getElementById('group-select');
    const guidanceText = document.getElementById('guidance-text');
    const subjectIndicator = document.getElementById('subject-indicator');
    const subjectName = document.getElementById('subject-name');
    const studentsSection = document.getElementById('students-section');
    const studentsList = document.getElementById('students-list');

    const gradeModal = document.getElementById('grade-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalStudentName = document.getElementById('modal-student-name');
    const modalLockState = document.getElementById('modal-lock-state');
    const modalRevealState = document.getElementById('modal-reveal-state');
    const lockTarget = document.getElementById('lock-target');
    
    const modalBadgeMsg = document.getElementById('modal-badge-msg');
    const modalGradeValue = document.getElementById('modal-grade-value');
    const modalBreakdown = document.getElementById('modal-breakdown');
    const modalInfractionsList = document.getElementById('modal-infractions-list');

    let currentStudent = null;
    let currentSubject = '';
    let pressTimer = null;
    let explosionTimeout = null;
    const holdDuration = 4000;

    groupSelect.addEventListener('change', (e) => {
        const group = e.target.value;
        if (!group) return;

        let data = null;
        if (group.startsWith('2')) {
            currentSubject = 'CULTURA DIGITAL';
            data = window.data200[group] || [];
        } else if (group.startsWith('4')) {
            currentSubject = 'MATEMÁTICAS';
            data = window.data400[group] || [];
        }

        guidanceText.textContent = 'Busca tu nombre para ver tu calificación';
        subjectName.textContent = currentSubject;
        subjectIndicator.classList.remove('hidden');
        renderStudents(data);
    });

    function getColorClassText(grade) {
        if (grade <= 5.9) return 'text-red';
        if (grade >= 6.0 && grade <= 6.9) return 'text-orange';
        if (grade >= 7.0 && grade <= 7.9) return 'text-yellow';
        if (grade >= 8.0 && grade <= 8.9) return 'text-green';
        if (grade >= 9.0 && grade <= 9.9) return 'text-blue';
        if (grade === 10.0) return 'text-gold-style';
        return '';
    }

    function getFeedbackMessage(grade) {
        if (grade === 10.0) return 'FELICIDADES';
        if (grade >= 9.0 && grade <= 9.9) return 'EXCELENTE';
        if (grade >= 8.0 && grade <= 8.9) return 'MUY BIEN';
        if (grade >= 7.0 && grade <= 7.9) return 'BIEN';
        if (grade >= 6.0 && grade <= 6.9) return 'SI SE PUDO';
        return 'HAY QUE ESFORZARSE MÁS';
    }

    function renderStudents(students) {
        studentsList.innerHTML = '';
        if (students.length === 0) {
            studentsList.innerHTML = '<p style="text-align:center; font-weight:600; color:var(--text-muted);">No hay alumnos registrados.</p>';
            studentsSection.classList.remove('hidden');
            return;
        }

        students.forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card';
            
            card.innerHTML = `
                <div class="student-info-left">
                    <div class="student-name">${student.nombre}</div>
                </div>
            `;

            card.addEventListener('click', () => openModal(student));
            studentsList.appendChild(card);
        });

        studentsSection.classList.remove('hidden');
    }

    function openModal(student) {
        currentStudent = student;
        modalStudentName.textContent = student.nombre;
        
        modalLockState.classList.remove('hidden');
        modalRevealState.classList.add('hidden');
        lockTarget.className = 'lock-circle';
        
        gradeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        gradeModal.classList.add('hidden');
        document.body.style.overflow = '';
        resetPress();
        if (explosionTimeout) {
            clearTimeout(explosionTimeout);
            explosionTimeout = null;
        }
    }

    closeModalBtn.addEventListener('click', closeModal);
    
    gradeModal.addEventListener('click', (e) => {
        if (e.target === gradeModal) closeModal();
    });

    function startPress(e) {
        e.preventDefault();
        if (lockTarget.classList.contains('spectacular-explosion')) return;
        
        lockTarget.classList.add('pressing');
        
        pressTimer = setTimeout(() => {
            triggerExplosion();
        }, holdDuration);
    }

    function resetPress() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        if (!lockTarget.classList.contains('spectacular-explosion')) {
            lockTarget.classList.remove('pressing');
        }
    }

    lockTarget.addEventListener('mousedown', startPress);
    lockTarget.addEventListener('touchstart', startPress, { passive: false });
    
    lockTarget.addEventListener('mouseup', resetPress);
    lockTarget.addEventListener('mouseleave', resetPress);
    lockTarget.addEventListener('touchend', resetPress);

    function triggerExplosion() {
        pressTimer = null;
        lockTarget.className = 'lock-circle spectacular-explosion';
        
        explosionTimeout = setTimeout(() => {
            revealGrade();
        }, 600);
    }

    function revealGrade() {
        modalLockState.classList.add('hidden');
        
        const grade = currentStudent.calificacionFinal;
        const colorClass = getColorClassText(grade);
        
        modalBadgeMsg.textContent = getFeedbackMessage(grade);
        modalBadgeMsg.className = `modal-badge-msg ${grade === 10.0 ? 'text-gold' : colorClass}`;
        
        modalGradeValue.textContent = grade.toFixed(1);
        modalGradeValue.className = `modal-grade-value ${colorClass}`;
        
        let breakdownHTML = '';
        if (currentSubject === 'CULTURA DIGITAL') {
            breakdownHTML = `
                <div class="breakdown-row"><span>Trabajos:</span><span>${currentStudent.trabajos} pts</span></div>
                <div class="breakdown-row"><span>Actitudinal:</span><span>${currentStudent.actitudinal} pts</span></div>
                <div class="breakdown-row"><span>Extras:</span><span>${currentStudent.extras} pts</span></div>
            `;
        } else if (currentSubject === 'MATEMÁTICAS') {
            breakdownHTML = `
                <div class="breakdown-row"><span>Trabajos:</span><span>${currentStudent.trabajos} pts</span></div>
                <div class="breakdown-row"><span>Proyecto:</span><span>${currentStudent.proyecto} pts</span></div>
                <div class="breakdown-row"><span>Actitudinal:</span><span>${currentStudent.actitudinal} pts</span></div>
                <div class="breakdown-row"><span>Extras:</span><span>${currentStudent.extras} pts</span></div>
            `;
        }
        modalBreakdown.innerHTML = breakdownHTML;

        modalInfractionsList.innerHTML = '';
        if (currentStudent.infracciones && currentStudent.infracciones.length > 0) {
            currentStudent.infracciones.forEach(inf => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="infraction-content">
                        <span class="infraction-concept">${inf.concepto}</span>
                        <span class="infraction-date">${inf.fecha}</span>
                    </div>
                `;
                modalInfractionsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'no-infractions';
            li.textContent = '(Sin infracciones)';
            modalInfractionsList.appendChild(li);
        }

        modalRevealState.classList.remove('hidden');
    }
});