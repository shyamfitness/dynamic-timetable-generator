class TimetableGenerator {
    constructor() {
        this.form = document.getElementById('setupForm');
        this.timetable = document.getElementById('timetable');
        this.timetableBody = document.getElementById('timetableBody');
        this.daysRow = document.getElementById('daysRow');
        this.emptyState = document.getElementById('emptyState');
        this.helpModal = document.getElementById('helpModal');
        this.helpBtn = document.getElementById('helpBtn');
        this.closeBtn = document.querySelector('.close-btn');
        this.exportBtn = document.getElementById('exportBtn');
        this.emptyStateBtn = document.getElementById('emptyStateBtn');

        this.attachEventListeners();
        this.initializeHelpModal();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateTimetable();
        });

        document.getElementById('addSubject').addEventListener('click', () => {
            this.addSubjectField();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetForm();
        });

        document.getElementById('printBtn').addEventListener('click', () => {
            window.print();
        });

        document.getElementById('enableLunch').addEventListener('change', (e) => {
            const lunchOptions = document.getElementById('lunchOptions');
            lunchOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        document.querySelectorAll('input[name="scheduleType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const daySelector = document.getElementById('daySelector');
                daySelector.classList.toggle('hidden', e.target.value !== 'single');
            });
        });

        this.helpBtn.addEventListener('click', () => {
            this.helpModal.style.display = 'flex';
        });

        this.closeBtn.addEventListener('click', () => {
            this.helpModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.helpModal.style.display = 'none';
            }
        });

        this.exportBtn.addEventListener('click', () => {
            this.exportTimetable();
        });

        this.emptyStateBtn.addEventListener('click', () => {
            this.form.dispatchEvent(new Event('submit'));
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.helpModal.style.display === 'flex') {
                this.helpModal.style.display = 'none';
            }
        });
    }

    initializeHelpModal() {
        // Add keyboard navigation for modal
        this.helpModal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusableElements = this.helpModal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstFocusableElement = focusableElements[0];
                const lastFocusableElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    addSubjectField() {
        const subjectsList = document.getElementById('subjectsList');
        const subjectEntry = document.createElement('div');
        subjectEntry.className = 'subject-entry';
        subjectEntry.innerHTML = `
            <input type="text" class="subject-name" placeholder="Enter subject name" required>
            <input type="color" class="subject-color" value="${this.getRandomColor()}">
            <button type="button" class="remove-btn" title="Remove subject">×</button>
        `;

        subjectEntry.querySelector('.remove-btn').addEventListener('click', () => {
            subjectEntry.remove();
        });

        subjectsList.appendChild(subjectEntry);
    }

    getRandomColor() {
        const colors = [
            '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585',
            '#06d6a0', '#ffd166', '#ef476f', '#4895ef'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    resetForm() {
        this.form.reset();
        const subjectsList = document.getElementById('subjectsList');
        subjectsList.innerHTML = `
            <div class="subject-entry">
                <input type="text" class="subject-name" placeholder="Enter subject name" required>
                <input type="color" class="subject-color" value="#4361ee">
                <button type="button" class="remove-btn" title="Remove subject">×</button>
            </div>
        `;
        document.getElementById('lunchOptions').style.display = 'none';
        document.getElementById('daySelector').classList.add('hidden');
        this.timetableBody.innerHTML = '';
        this.emptyState.style.display = 'flex';
    }

    generateTimetable() {
        const formData = this.getFormData();
        if (!this.validateFormData(formData)) return;

        this.createTimetable(formData);
        this.emptyState.style.display = 'none';
    }

    getFormData() {
        const subjects = Array.from(document.querySelectorAll('.subject-name')).map(input => ({
            name: input.value,
            color: input.nextElementSibling.value
        }));

        return {
            totalHours: parseInt(document.getElementById('totalHours').value),
            startTime: document.getElementById('startTime').value,
            periodDuration: parseInt(document.getElementById('periodDuration').value),
            breakDuration: parseInt(document.getElementById('breakDuration').value),
            scheduleType: document.querySelector('input[name="scheduleType"]:checked').value,
            selectedDay: document.getElementById('selectedDay').value,
            subjects: subjects,
            lunchEnabled: document.getElementById('enableLunch').checked,
            lunchAfter: parseInt(document.getElementById('lunchAfter').value),
            lunchLabel: document.getElementById('lunchLabel').value,
            lunchDuration: parseInt(document.getElementById('lunchDuration').value)
        };
    }

    validateFormData(data) {
        if (data.subjects.length === 0) {
            alert('Please add at least one subject');
            return false;
        }

        if (data.lunchEnabled && data.lunchAfter >= data.totalHours) {
            alert('Lunch break must be inserted before the last period');
            return false;
        }

        // Only validate break duration if it's greater than 0
        if (data.breakDuration > 0 && data.breakDuration < 5) {
            alert('If you want to add breaks, they must be at least 5 minutes');
            return false;
        }

        return true;
    }

    createTimetable(data) {
        this.timetableBody.innerHTML = '';
        this.daysRow.innerHTML = '<th>Time</th>';

        const days = this.getDays(data.scheduleType, data.selectedDay);
        days.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            this.daysRow.appendChild(th);
        });

        const startTime = new Date(`2000-01-01T${data.startTime}`);
        const timeSlots = this.generateTimeSlots(startTime, data);

        timeSlots.forEach(slot => {
            const row = document.createElement('tr');
            
            // Time column
            const timeCell = document.createElement('td');
            timeCell.textContent = slot.time;
            row.appendChild(timeCell);

            // Subject cells
            days.forEach(day => {
                const cell = document.createElement('td');
                if (slot.isLunch) {
                    cell.textContent = data.lunchLabel;
                    cell.style.backgroundColor = 'var(--warning)';
                } else if (slot.isBreak) {
                    cell.textContent = 'Break';
                    cell.style.backgroundColor = '#f0f0f0';
                    cell.style.color = '#666';
                } else {
                    const subject = this.getRandomSubject(data.subjects);
                    cell.textContent = subject.name;
                    cell.style.backgroundColor = subject.color;
                    cell.style.color = this.getContrastColor(subject.color);
                }
                row.appendChild(cell);
            });

            this.timetableBody.appendChild(row);
        });
    }

    getDays(scheduleType, selectedDay) {
        switch (scheduleType) {
            case 'single':
                return [selectedDay];
            case 'weekdays':
                return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            case 'fullweek':
                return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            default:
                return [];
        }
    }

    generateTimeSlots(startTime, data) {
        const slots = [];
        let currentTime = new Date(startTime);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + data.totalHours);

        while (currentTime < endTime) {
            const periodStart = new Date(currentTime);
            const periodEnd = new Date(currentTime);
            periodEnd.setMinutes(periodEnd.getMinutes() + data.periodDuration);

            const timeString = `${periodStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${periodEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            
            const isLunch = data.lunchEnabled && 
                           slots.length === data.lunchAfter;

            slots.push({
                time: timeString,
                isLunch: isLunch,
                duration: isLunch ? data.lunchDuration : data.periodDuration
            });

            // Move to next slot
            if (isLunch) {
                currentTime.setMinutes(currentTime.getMinutes() + data.lunchDuration);
            } else {
                currentTime.setMinutes(currentTime.getMinutes() + data.periodDuration);
                // Add break only if it's not the last period and break duration is greater than 0
                if (currentTime < endTime && data.breakDuration > 0) {
                    const breakStart = new Date(currentTime);
                    const breakEnd = new Date(currentTime);
                    breakEnd.setMinutes(breakEnd.getMinutes() + data.breakDuration);
                    
                    const breakTimeString = `${breakStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${breakEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    
                    slots.push({
                        time: breakTimeString,
                        isBreak: true,
                        duration: data.breakDuration
                    });
                    
                    currentTime.setMinutes(currentTime.getMinutes() + data.breakDuration);
                }
            }
        }
        return slots;
    }

    getRandomSubject(subjects) {
        return subjects[Math.floor(Math.random() * subjects.length)];
    }

    getContrastColor(hexColor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    exportTimetable() {
        if (this.timetableBody.children.length === 0) {
            alert('Please generate a timetable first');
            return;
        }

        const timetableData = {
            title: 'My Timetable',
            generatedAt: new Date().toLocaleString(),
            data: Array.from(this.timetableBody.children).map(row => {
                const cells = Array.from(row.children);
                return {
                    time: cells[0].textContent,
                    subjects: cells.slice(1).map(cell => ({
                        text: cell.textContent,
                        color: cell.style.backgroundColor
                    }))
                };
            })
        };

        const blob = new Blob([JSON.stringify(timetableData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timetable.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the timetable generator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimetableGenerator();
});