export async function fetchPaymentsByLoanId(loanId: number) {
    const res = await fetch(`http://localhost:5000/api/payments/${loanId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch payments");
    return res.json();
  }
  