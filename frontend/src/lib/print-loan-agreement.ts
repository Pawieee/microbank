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

export const printLoanAgreement = (data: LoanAgreementData) => {
  const releaseDate = new Date();
  
  // Calculate First Payment Date logic
  let firstPaymentDate = new Date();
  if (data.payment_schedule === "Weekly") {
    firstPaymentDate = addWeeks(releaseDate, 1);
  } else if (data.payment_schedule === "Bi-Weekly") {
    firstPaymentDate = addDays(releaseDate, 15);
  } else {
    firstPaymentDate = addMonths(releaseDate, 1);
  }

  const firstPaymentStr = format(firstPaymentDate, "MMMM do, yyyy");
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
          <li><strong>PROMISE TO PAY:</strong> The Borrower unconditionally promises to pay the Lender the Total Repayment Amount in accordance with the schedule specified above.</li>
          
          <li><strong>FINAL PAYMENT ADJUSTMENT (DUST VALUE):</strong> The Borrower acknowledges that the Installment Amount is an estimate. <strong>The final scheduled payment may vary slightly ("Dust Value")</strong> to reconcile any decimal discrepancies and ensure the exact Total Repayment Amount is settled. The Borrower agrees to pay this adjusted final amount, whether it is slightly higher or lower than the regular installment.</li>

          <li><strong>LATE PENALTY FEES:</strong> In the event of a failure to pay any installment on its due date, a penalty charge of <strong>5% per month</strong> (or a fraction thereof) shall be added to the unpaid amount until fully settled.</li>

          <li><strong>APPLICATION OF PAYMENT:</strong> Payments made by the Borrower shall be applied in the following order: (1) Penalties and other charges, (2) Past due interest, (3) Past due principal, and (4) Current due amount.</li>

          <li><strong>EVENT OF DEFAULT:</strong> Failure to pay two (2) consecutive installments shall constitute an Event of Default. Upon default, the Lender reserves the right to accelerate the loan, rendering the entire outstanding balance immediately due and demandable without need for further notice or demand.</li>

          <li><strong>ATTORNEY'S FEES AND COSTS:</strong> Should the Lender be compelled to seek judicial relief to enforce this Agreement, the Borrower agrees to pay Attorney's Fees equivalent to 20% of the total amount due, plus costs of suit.</li>

          <li><strong>WAIVER:</strong> No failure or delay by the Lender in exercising any right under this Agreement shall operate as a waiver thereof.</li>
        </ol>

        <p><strong>IN WITNESS WHEREOF</strong>, the parties have set their hands on the date and place first above written.</p>

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
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  // Allow time for styles to load before printing
  setTimeout(() => {
    printWindow.print();
  }, 500);
};