export async function approveLoan(loanId: string) {
    const response = await fetch(`/api/loans/${loanId}/approve`, {
      method: "POST",
      credentials: "include",
    });
  
    if (!response.ok) {
      throw new Error("Failed to approve loan");
    }
  
    const data = await response.json();
    return data; // should have { success: true }
  }
  