import { format, addMonths, addWeeks, addDays } from "date-fns";

export interface LoanAgreementData {
  loan_id: string;
  applicant_name: string;
  address: string;
  principal: number;
  interest_rate: number;
  total_repayment: number;
  payment_schedule: string;
  duration: number;
  date_applied: string;
  manager_name: string;
}

interface AmortizationRow {
  num: number;
  date: string;
  amount: string;
  balance: string;
}

export const printLoanAgreement = (data: LoanAgreementData) => {
  const releaseDate = new Date();

  // --- 1. CALCULATE SCHEDULE LOGIC ---
  const generateAmortizationSchedule = (): AmortizationRow[] => {
    const rows: AmortizationRow[] = [];
    let periodCount = 0;
    let addInterval: (date: Date, amount: number) => Date;

    if (data.payment_schedule === "Weekly") {
      periodCount = data.duration * 4;
      addInterval = addWeeks;
    } else if (data.payment_schedule === "Bi-Weekly") {
      periodCount = data.duration * 2;
      addInterval = (d, n) => addDays(d, n * 15); 
    } else {
      periodCount = data.duration;
      addInterval = addMonths;
    }

    const rawInstallment = data.total_repayment / periodCount;
    const installment = Math.floor(rawInstallment * 100) / 100;
    
    let currentBalance = data.total_repayment;
    let currentDate = releaseDate;

    for (let i = 1; i <= periodCount; i++) {
      currentDate = addInterval(releaseDate, i); 
      let payAmount = installment;

      if (i === periodCount) {
        payAmount = currentBalance;
      }

      currentBalance -= payAmount;
      if (currentBalance < 0) currentBalance = 0;

      rows.push({
        num: i,
        date: format(currentDate, "MMM dd, yyyy"),
        amount: payAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        balance: currentBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
    }
    return rows;
  };

  const scheduleRows = generateAmortizationSchedule();
  const firstPaymentStr = scheduleRows.length > 0 ? scheduleRows[0].date : "N/A";
  const releaseDateStr = format(releaseDate, "MMMM do, yyyy");
  const dateAppliedStr = data.date_applied
    ? format(new Date(data.date_applied), "MMM dd, yyyy")
    : "N/A";

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <html>
      <head>
        <title>Loan Agreement - ${data.applicant_name}</title>
        <style>
          @page { size: A4; margin: 2.5cm; }
          body { 
            font-family: 'Times New Roman', serif; 
            color: #000; 
            line-height: 1.4;
            font-size: 11pt; 
          }
          
          /* Force Page Break */
          .page-break { 
            page-break-before: always; 
            margin-top: 2rem;
          }

          .header { text-align: center; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          .header h2 { margin: 0; font-size: 10pt; font-weight: normal; }
          
          .doc-title { 
            text-align: center; 
            font-weight: bold; 
            text-decoration: underline; 
            margin: 20px 0; 
            font-size: 12pt; 
          }
          
          .section-title {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            margin-top: 15px;
            margin-bottom: 8px;
            padding-bottom: 2px;
          }

          p { margin-bottom: 8px; text-align: justify; }
          
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10pt;
          }
          .details-table td {
            padding: 4px;
            border: 1px solid #000;
          }
          .details-label {
            font-weight: bold;
            background-color: #f0f0f0;
            width: 35%;
          }

          .amort-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            text-align: center;
            margin-top: 10px;
          }
          .amort-table th {
            border: 1px solid #000;
            background-color: #ddd;
            padding: 4px;
            font-weight: bold;
          }
          .amort-table td {
            border: 1px solid #000;
            padding: 3px;
          }
          .amort-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          .terms-list {
            padding-left: 20px;
            font-size: 10pt;
          }
          .terms-list li {
            margin-bottom: 8px;
            text-align: justify;
          }

          .signatures { 
            margin-top: 40px; 
            display: flex; 
            justify-content: space-between; 
            page-break-inside: avoid;
          }
          .sig-block { 
            text-align: center; 
            width: 45%; 
          }
          .sig-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .sig-role {
            font-size: 9pt;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Microbank Incorporated</h1>
          <h2>Davao City, Philippines</h2>
        </div>

        <div class="doc-title">LOAN AGREEMENT AND PROMISSORY NOTE</div>

        <p>This Loan Agreement ("Agreement") is made and executed on this <strong>${releaseDateStr}</strong> at Davao City, Philippines, by and between:</p>

        <p><strong>LENDER:</strong> <strong>MICROBANK INC.</strong>, a financial institution organized under the laws of the Philippines.</p>
        
        <p><strong>BORROWER:</strong> <strong>${data.applicant_name.toUpperCase()}</strong>, of legal age, with permanent residence at <u>${data.address}</u>.</p>

        <div class="section-title">1. LOAN DETAILS</div>
        <table class="details-table">
          <tr>
            <td class="details-label">Loan Account No.</td>
            <td>${data.loan_id}</td>
          </tr>
          <tr>
            <td class="details-label">Date Applied</td>
            <td>${dateAppliedStr}</td>
          </tr>
          <tr>
            <td class="details-label">Principal Amount</td>
            <td>PHP ${data.principal?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="details-label">Interest Rate</td>
            <td>${data.interest_rate}%</td>
          </tr>
          <tr>
            <td class="details-label">Total Repayment Amount</td>
            <td><strong>PHP ${data.total_repayment?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
          </tr>
          <tr>
            <td class="details-label">Payment Frequency</td>
            <td>${data.payment_schedule}</td>
          </tr>
          <tr>
            <td class="details-label">Loan Duration</td>
            <td>${data.duration} Months</td>
          </tr>
          <tr>
            <td class="details-label">First Payment Due</td>
            <td>${firstPaymentStr}</td>
          </tr>
        </table>

        <div class="section-title">2. TERMS AND CONDITIONS</div>
        <ol class="terms-list">
          <li><strong>PROMISE TO PAY:</strong> The Borrower unconditionally promises to pay the Lender the Total Repayment Amount in accordance with the attached schedule.</li>
          <li><strong>FINAL PAYMENT ADJUSTMENT:</strong> The Borrower acknowledges that the final scheduled payment may vary slightly ("Dust Value") to reconcile any decimal discrepancies.</li>
          <li><strong>LATE PENALTY FEES:</strong> In the event of a failure to pay any installment on its due date, a penalty charge of <strong>5% per month</strong> shall be added to the unpaid amount.</li>
          <li><strong>DEFAULT:</strong> Failure to pay two (2) consecutive installments shall constitute an Event of Default, rendering the entire outstanding balance immediately due.</li>
        </ol>

        <div style="margin-top: 20px;">
          <p><strong>IN WITNESS WHEREOF</strong>, the parties have set their hands on the date and place first above written.</p>
        </div>

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line">${data.applicant_name}</div>
            <div class="sig-role">Signature over Printed Name of Borrower</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">${data.manager_name}</div>
            <div class="sig-role">Authorized Manager, Microbank Inc.</div>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="header">
          <h1>Microbank Incorporated</h1>
          <h2>Amortization Schedule</h2>
        </div>

        <div class="section-title">3. PAYMENT SCHEDULE</div>
        <p style="font-size: 9pt; font-style: italic;">
          Account: <strong>${data.applicant_name}</strong> (Loan #${data.loan_id}) <br/>
          Start Date: ${releaseDateStr} | Frequency: ${data.payment_schedule}
        </p>
        
        <table class="amort-table">
          <thead>
            <tr>
              <th style="width: 10%">No.</th>
              <th style="width: 30%">Due Date</th>
              <th style="width: 30%">Amount Due</th>
              <th style="width: 30%">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${scheduleRows.map(row => `
              <tr>
                <td>${row.num}</td>
                <td>${row.date}</td>
                <td>PHP ${row.amount}</td>
                <td>PHP ${row.balance}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; font-size: 9pt; font-style: italic;">
          *** End of Schedule ***
        </div>

      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};