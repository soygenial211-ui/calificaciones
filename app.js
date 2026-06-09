// app.js
document.addEventListener('DOMContentLoaded', () => {
    // Variable de configuración global para controlar la visualización de los criterios
    const MOSTRAR_CRITERIOS = false;

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

    // ------------------------------------------------------------
    // CONFIGURACIÓN DE MÁXIMOS POR GRUPO (Modifica los números según corresponda)
    // ------------------------------------------------------------
    const maximosPorGrupo = {
        "201": { trabajos: 60, actitudinal: 20, extras: 20 },
        "202": { trabajos: 50, actitudinal: 30, extras: 20 },
        "203": { trabajos: 56, actitudinal: 24, extras: 20 },
        "204": { trabajos: 60, actitudinal: 20, extras: 20 },
        "205": { trabajos: 60, actitudinal: 20, extras: 20 },
        
        "401": { trabajos: 40, proyecto: 30, actitudinal: 20, extras: 10 },
        "402": { trabajos: 45, proyecto: 35, actitudinal: 10, extras: 10 },
        "403": { trabajos: 50, proyecto: 30, actitudinal: 10, extras: 10 },
        "404": { trabajos: 40, proyecto: 30, actitudinal: 20, extras: 10 },
        "405": { trabajos: 40, proyecto: 30, actitudinal: 20, extras: 10 },
        "406": { trabajos: 40, proyecto: 30, actitudinal: 20, extras: 10 }
    };

    let currentStudent = null;
    let currentSubject = '';
    let pressTimer = null;
    let explosionTimeout = null;
    const holdDuration = 4000;
    
    // Almacena los topes numéricos del grupo seleccionado
    let currentGroupMaximos = null;

    groupSelect.addEventListener('change', (e) => {
        const group = e.target.value;
        if (!group) return;

        let data = [];
        if (group.startsWith('2')) {
            currentSubject = 'CULTURA DIGITAL';
            data = window.data200[group] || [];
        } else if (group.startsWith('4')) {
            currentSubject = 'MATEMÁTICAS';
            data = window.data400[group] || [];
        }

        // Obtener los límites del grupo actual desde el mapa local
        currentGroupMaximos = maximosPorGrupo[group] || null;

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
        if (grade >= 9.0 && grade <= 9.9) return 'MUY BIEN';
        if (grade >= 8.0 && grade <= 8.9) return 'BIEN';
        if (grade >= 7.0 && grade <= 7.9) return 'OK';
        if (grade >= 6.0 && grade <= 6.9) return 'POR POQUITO...';
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
        
        if (MOSTRAR_CRITERIOS) {
            modalBreakdown.style.display = '';
            
            // Formatear las leyendas dinámicas " de X" leyendo el mapa de máximos
            const maxT = currentGroupMaximos ? ` de ${currentGroupMaximos.trabajos}` : '';
            const maxA = currentGroupMaximos ? ` de ${currentGroupMaximos.actitudinal}` : '';
            const maxE = currentGroupMaximos ? ` de ${currentGroupMaximos.extras}` : '';
            const maxP = currentGroupMaximos ? ` de ${currentGroupMaximos.proyecto}` : '';
            
            // Función auxiliar para calcular el porcentaje real obtenido (0 a 100)
            function obtenerPorcentaje(actual, maximo) {
                if (!maximo) return 0;
                return Math.max(0, Math.min(100, (actual / maximo) * 100));
            }

            // Función auxiliar para determinar la clase de color sólido según tercios del porcentaje
            function obtenerClaseColorBarra(porcentaje) {
                if (porcentaje < 33.33) return 'bg-red';
                if (porcentaje < 66.66) return 'bg-yellow';
                return 'bg-green';
            }

            // Calcular porcentajes reales conseguidos por el estudiante
            const pctT = currentGroupMaximos ? obtenerPorcentaje(currentStudent.trabajos, currentGroupMaximos.trabajos) : 0;
            const pctA = currentGroupMaximos ? obtenerPorcentaje(currentStudent.actitudinal, currentGroupMaximos.actitudinal) : 0;
            const pctP = currentGroupMaximos ? obtenerPorcentaje(currentStudent.proyecto, currentGroupMaximos.proyecto) : 0;

            // Obtener la clase de color correspondiente a cada porcentaje obtenido
            const colorT = obtenerClaseColorBarra(pctT);
            const colorA = obtenerClaseColorBarra(pctA);
            const colorP = obtenerClaseColorBarra(pctP);

            let breakdownHTML = '';
            if (currentSubject === 'CULTURA DIGITAL') {
                breakdownHTML = `
                    <div class="breakdown-row"><span>Trabajos:</span><span>${currentStudent.trabajos}${maxT} pts</span><div class="progress-track"><div class="progress-fill-bar ${colorT}" style="width: ${pctT}%;"></div></div></div>
                    <div class="breakdown-row"><span>Actitudinal:</span><span>${currentStudent.actitudinal}${maxA} pts</span><div class="progress-track"><div class="progress-fill-bar ${colorA}" style="width: ${pctA}%;"></div></div></div>
                    <div class="breakdown-row"><span>Extras:</span><span>${currentStudent.extras}${maxE} pts</span></div>
                `;
            } else if (currentSubject === 'MATEMÁTICAS') {
                breakdownHTML = `
                    <div class="breakdown-row"><span>Trabajos:</span><span>${currentStudent.trabajos}${maxT} pts</span><div class="progress-track"><div class="progress-fill-bar ${colorT}" style="width: ${pctT}%;"></div></div></div>
                    <div class="breakdown-row"><span>Proyecto:</span><span>${currentStudent.proyecto}${maxP} pts</span><div class="progress-track"><div class="progress-fill-bar ${colorP}" style="width: ${pctP}%;"></div></div></div>
                    <div class="breakdown-row"><span>Actitudinal:</span><span>${currentStudent.actitudinal}${maxA} pts</span><div class="progress-track"><div class="progress-fill-bar ${colorA}" style="width: ${pctA}%;"></div></div></div>
                    <div class="breakdown-row"><span>Extras:</span><span>${currentStudent.extras}${maxE} pts</span></div>
                `;
            }
            modalBreakdown.innerHTML = breakdownHTML;
        } else {
            modalBreakdown.innerHTML = '';
            modalBreakdown.style.display = 'none';
        }

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
