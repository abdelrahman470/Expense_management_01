// إدارة المصاريف الشهرية - JavaScript
class ExpenseManager {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentEditId = null;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.monthlyChart = null;
        this.categoryChart = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderTransactions();
        this.updateCharts();
        this.populateCategoryFilter();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterTransactions();
        });

        document.getElementById('typeFilter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterTransactions();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const text = link.textContent.trim();
                if (text.includes('الرئيسية')) {
                    this.showDashboard();
                } else if (text.includes('إضافة')) {
                    this.showAddForm();
                }
            });
        });
    }

    // حفظ البيانات في localStorage
    saveTransactions() {
        localStorage.setItem('expenseManager', JSON.stringify(this.transactions));
    }

    // تحميل البيانات من localStorage
    loadTransactions() {
        const saved = localStorage.getItem('expenseManager');
        return saved ? JSON.parse(saved) : [];
    }

    // إضافة أو تعديل عملية
    saveTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const transaction = {
            id: this.currentEditId || Date.now().toString(),
            type: document.querySelector('input[name="type"]:checked').value,
            category: document.getElementById('category').value,
            amount: parseFloat(document.getElementById('amount').value),
            date: document.getElementById('date').value,
            notes: document.getElementById('notes').value,
            createdAt: this.currentEditId ? 
                this.transactions.find(t => t.id === this.currentEditId)?.createdAt || new Date().toISOString() : 
                new Date().toISOString()
        };

        // التحقق من صحة البيانات
        if (!transaction.category || !transaction.amount || !transaction.date) {
            this.showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        if (transaction.amount <= 0) {
            this.showAlert('المبلغ يجب أن يكون أكبر من صفر', 'error');
            return;
        }

        // حفظ أو تحديث العملية
        if (this.currentEditId) {
            console.log('تعديل العملية:', this.currentEditId);
            const index = this.transactions.findIndex(t => t.id === this.currentEditId);
            console.log('فهرس العملية:', index);
            if (index !== -1) {
                // استبدال العملية القديمة بالجديدة
                this.transactions[index] = transaction;
                console.log('تم تحديث العملية في الفهرس:', index);
                console.log('العمليات بعد التحديث:', this.transactions);
                this.showAlert('تم تحديث العملية بنجاح', 'success');
            } else {
                this.showAlert('لم يتم العثور على العملية للتعديل', 'error');
                return;
            }
        } else {
            this.transactions.push(transaction);
            this.showAlert('تم إضافة العملية بنجاح', 'success');
        }

        this.saveTransactions();
        this.updateDashboard();
        this.renderTransactions();
        this.updateCharts();
        this.showDashboard();
        
        // إعادة تعيين معرف التعديل قبل إعادة تعيين النموذج
        this.currentEditId = null;
        console.log('تم إعادة تعيين currentEditId');
        
        // إعادة تعيين النموذج
        this.resetForm();
    }

    // حذف عملية
    deleteTransaction(id) {
        Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذه العملية؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            background: '#1b3a36',
            color: '#e0e0e0'
        }).then((result) => {
            if (result.isConfirmed) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveTransactions();
                this.updateDashboard();
                this.renderTransactions();
                this.updateCharts();
                this.showAlert('تم حذف العملية بنجاح', 'success');
            }
        });
    }

    // تعديل عملية
    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) {
            this.showAlert('لم يتم العثور على العملية', 'error');
            return;
        }

        this.currentEditId = id;
        console.log('تم تعيين currentEditId إلى:', id);
        this.showAddForm();

        // ملء النموذج بالبيانات
        document.getElementById('editId').value = id;
        document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
        document.getElementById('category').value = transaction.category;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('date').value = transaction.date;
        document.getElementById('notes').value = transaction.notes;

        // تحديث عنوان النموذج
        document.querySelector('#form-section .card-title').innerHTML = 
            '<i class="fas fa-edit me-2"></i>تعديل العملية';
        
        // إضافة تأثير بصري
        document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
    }

    // عرض لوحة التحكم
    showDashboard() {
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('form-section').style.display = 'none';
        this.updateDashboard();
    }

    // عرض نموذج الإضافة
    showAddForm() {
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('form-section').style.display = 'block';
        // لا نعيد تعيين النموذج هنا إذا كنا في وضع التعديل
        if (!this.currentEditId) {
            this.resetForm();
        }
    }

    // إعادة تعيين النموذج
    resetForm() {
        document.getElementById('transactionForm').reset();
        document.getElementById('editId').value = '';
        // لا نعيد تعيين currentEditId هنا لأنه تم تعيينه مسبقاً
        document.querySelector('#form-section .card-title').innerHTML = 
            '<i class="fas fa-plus me-2"></i>إضافة عملية جديدة';
        this.setDefaultDate();
        console.log('تم إعادة تعيين النموذج');
        
        // التأكد من أن النموذج تم إعادة تعيينه
        document.querySelector('input[name="type"][value="expense"]').checked = true;
    }

    // تعيين التاريخ الافتراضي
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    // تحديث لوحة التحكم
    updateDashboard() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const remainingBalance = totalIncome - totalExpenses;

        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('remaining-balance').textContent = this.formatCurrency(remainingBalance);

        // تحديث ألوان الرصيد
        const balanceElement = document.getElementById('remaining-balance');
        if (remainingBalance >= 0) {
            balanceElement.className = 'text-success';
        } else {
            balanceElement.className = 'text-danger';
        }
    }

    // عرض العمليات
    renderTransactions() {
        const tbody = document.getElementById('transactionsTableBody');
        const filteredTransactions = this.getFilteredTransactions();

        if (filteredTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        لا توجد عمليات للعرض
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredTransactions.map(transaction => `
            <tr class="fade-in-up">
                <td>${this.formatDate(transaction.date)}</td>
                <td>
                    <span class="badge ${transaction.type === 'income' ? 'badge-success' : 'badge-danger'}">
                        <i class="fas fa-${transaction.type === 'income' ? 'arrow-up' : 'arrow-down'} me-1"></i>
                        ${transaction.type === 'income' ? 'دخل' : 'مصروف'}
                    </span>
                </td>
                <td>
                    <i class="fas fa-${this.getCategoryIcon(transaction.category)} me-1"></i>
                    ${transaction.category}
                </td>
                <td class="fw-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </td>
                <td>${transaction.notes || '-'}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="expenseManager.editTransaction('${transaction.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="expenseManager.deleteTransaction('${transaction.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // فلترة العمليات
    getFilteredTransactions() {
        let filtered = [...this.transactions];

        // البحث
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.category.toLowerCase().includes(searchTerm) ||
                t.notes.toLowerCase().includes(searchTerm)
            );
        }

        // فلترة النوع
        const typeFilter = document.getElementById('typeFilter').value;
        if (typeFilter) {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // فلترة الفئة
        const categoryFilter = document.getElementById('categoryFilter').value;
        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // الترتيب
        if (this.sortColumn !== null) {
            filtered.sort((a, b) => {
                let aVal, bVal;
                
                switch(this.sortColumn) {
                    case 0: // التاريخ
                        aVal = new Date(a.date);
                        bVal = new Date(b.date);
                        break;
                    case 1: // النوع
                        aVal = a.type;
                        bVal = b.type;
                        break;
                    case 2: // الفئة
                        aVal = a.category;
                        bVal = b.category;
                        break;
                    case 3: // المبلغ
                        aVal = a.amount;
                        bVal = b.amount;
                        break;
                    default:
                        return 0;
                }

                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }

    // تطبيق الفلترة
    filterTransactions() {
        this.renderTransactions();
    }

    // ترتيب الجدول
    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.renderTransactions();
    }

    // تحديث الرسوم البيانية
    updateCharts() {
        this.updateMonthlyChart();
        this.updateCategoryChart();
    }

    // الرسم البياني الشهري
    updateMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        // تجميع البيانات حسب الشهر
        const monthlyData = this.getMonthlyData();
        
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        // التأكد من وجود البيانات
        if (monthlyData.labels.length === 0) {
            ctx.font = '16px Poppins';
            ctx.fillStyle = '#b0b0b0';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات للعرض', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'الدخل',
                        data: monthlyData.income,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'المصروفات',
                        data: monthlyData.expenses,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: 'rgba(79, 209, 197, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#b0b0b0',
                            callback: function(value) {
                                return value.toLocaleString() + ' ج.م';
                            }
                        },
                        grid: {
                            color: 'rgba(79, 209, 197, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // الرسم البياني للفئات
    updateCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        const categoryData = this.getCategoryData();
        
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        // التأكد من وجود البيانات
        if (categoryData.labels.length === 0) {
            ctx.font = '16px Poppins';
            ctx.fillStyle = '#b0b0b0';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات للعرض', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: categoryData.colors,
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#4fd1c5'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0',
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                family: 'Poppins'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1b3a36',
                        titleColor: '#e0e0e0',
                        bodyColor: '#e0e0e0',
                        borderColor: '#4fd1c5',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()} ج.م (${percentage}%)`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                }
            }
        });
    }

    // الحصول على البيانات الشهرية
    getMonthlyData() {
        const months = [];
        const income = [];
        const expenses = [];
        
        // الحصول على آخر 6 أشهر
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            months.push(this.getMonthName(date.getMonth()));
            
            const monthTransactions = this.transactions.filter(t => 
                t.date.startsWith(monthKey)
            );
            
            const monthIncome = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const monthExpenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            income.push(monthIncome);
            expenses.push(monthExpenses);
        }
        
        // إزالة الأشهر الفارغة من النهاية
        while (months.length > 0 && income[income.length - 1] === 0 && expenses[expenses.length - 1] === 0) {
            months.pop();
            income.pop();
            expenses.pop();
        }
        
        return { labels: months, income, expenses };
    }

    // الحصول على بيانات الفئات
    getCategoryData() {
        const categoryTotals = {};
        
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });
        
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        
        // ألوان مختلفة لكل فئة
        const categoryColors = {
            'طعام': '#FF6B6B',      // أحمر وردي
            'مواصلات': '#54ebe1ff',   // تركوازي
            'فواتير': '#186d80ff',    // أزرق فاتح
            'تسلية': '#52c690ff',     // أخضر فاتح
            'صحة': '#FFEAA7',       // أصفر فاتح
            'تعليم': '#DDA0DD',     // بنفسجي فاتح
            'أخرى': '#98D8C8',      // أخضر مزرق
            'راتب': '#6c1010ff',      // أصفر ذهبي
            'صحة': '#FF9F43',       // برتقالي
            'تسوق': '#35612bff',      // أخضر نعناعي
            'سكن': '#a785cbff'        // وردي فاتح
        };
        
        const colors = labels.map(category => categoryColors[category] || '#95A5A6');
        
        return { labels, data, colors };
    }

    // ملء فلتر الفئات
    populateCategoryFilter() {
        const categories = [...new Set(this.transactions.map(t => t.category))];
        const select = document.getElementById('categoryFilter');
        
        // إضافة الفئات الموجودة
        categories.forEach(category => {
            if (!Array.from(select.options).some(option => option.value === category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            }
        });
    }

    // تصدير تقرير PDF
    exportToPDF() {
        if (this.transactions.length === 0) {
            this.showAlert('لا توجد بيانات للتصدير', 'warning');
            return;
        }

        // التحقق من وجود مكتبة jsPDF
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            this.showAlert('خطأ في تحميل مكتبة PDF. يرجى إعادة تحميل الصفحة.', 'error');
            return;
        }

        try {
            // استخدام jsPDF مباشرة
            const { jsPDF } = window.jspdf || window;
            const doc = new jsPDF();
        
            // إنشاء تقرير بسيط
            doc.setFontSize(20);
            doc.text('تقرير المصاريف الشهرية', 20, 20);
            
            // حساب الملخص
            const totalIncome = this.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const totalExpenses = this.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const balance = totalIncome - totalExpenses;
            
            // إضافة الملخص
            doc.setFontSize(14);
            doc.text(`إجمالي الدخل: ${this.formatCurrency(totalIncome)}`, 20, 40);
            doc.text(`إجمالي المصروفات: ${this.formatCurrency(totalExpenses)}`, 20, 50);
            doc.text(`الرصيد المتبقي: ${this.formatCurrency(balance)}`, 20, 60);
            
            // إضافة العمليات
            doc.setFontSize(12);
            doc.text('تفاصيل العمليات:', 20, 80);
            
            let yPosition = 90;
            this.transactions.forEach((transaction, index) => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const line = `${this.formatDate(transaction.date)} - ${transaction.type === 'income' ? 'دخل' : 'مصروف'} - ${transaction.category} - ${this.formatCurrency(transaction.amount)}`;
                doc.text(line, 20, yPosition);
                yPosition += 10;
            });
            
            // حفظ الملف
            const fileName = `expense-report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            this.showAlert('تم إنشاء التقرير بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في إنشاء PDF:', error);
            this.showAlert(`حدث خطأ في إنشاء التقرير: ${error.message}`, 'error');
        }
    }

    // مسح جميع البيانات
    resetAllData() {
        Swal.fire({
            title: 'تأكيد مسح البيانات',
            text: 'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، امسح الكل',
            cancelButtonText: 'إلغاء',
            background: '#1b3a36',
            color: '#e0e0e0'
        }).then((result) => {
            if (result.isConfirmed) {
                this.transactions = [];
                localStorage.removeItem('expenseManager');
                this.updateDashboard();
                this.renderTransactions();
                this.updateCharts();
                this.showAlert('تم مسح جميع البيانات', 'success');
            }
        });
    }


    // تنسيق العملة
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // الحصول على اسم الشهر
    getMonthName(monthIndex) {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return months[monthIndex];
    }

    // الحصول على أيقونة الفئة
    getCategoryIcon(category) {
        const icons = {
            'طعام': 'utensils',
            'مواصلات': 'car',
            'فواتير': 'file-invoice',
            'تسلية': 'gamepad',
            'صحة': 'heart',
            'تعليم': 'graduation-cap',
            'أخرى': 'tag'
        };
        return icons[category] || 'tag';
    }

    // عرض التنبيهات
    showAlert(message, type = 'info') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#1b3a36',
            color: '#e0e0e0',
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }
}

// تهيئة التطبيق
let expenseManager;

document.addEventListener('DOMContentLoaded', function() {
    expenseManager = new ExpenseManager();
    
    // إضافة تأثيرات الحركة
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('fade-in-up');
    });
    
    // التأكد من أن المتغير متاح عالمياً
    window.expenseManager = expenseManager;
});

// دوال عامة للاستخدام في HTML
function showDashboard() {
    expenseManager.showDashboard();
}

function showAddForm() {
    expenseManager.showAddForm();
}

function sortTable(column) {
    expenseManager.sortTable(column);
}

function exportToPDF() {
    expenseManager.exportToPDF();
}

function resetAllData() {
    expenseManager.resetAllData();
}

