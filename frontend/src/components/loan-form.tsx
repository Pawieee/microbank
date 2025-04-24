import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

// Zod schema for form validation
const formSchema = z.object({
  employment_status: z.string(),
  loan_amount: z.coerce.number().min(5000).max(50000),
  loan_purpose: z.string(),
  monthly_revenue: z.coerce.number().min(7000).max(50000),
  credit_score: z.coerce.number().min(0).max(99999),
  last_name: z.string().min(1),
  first_name: z.string().min(1),
  middle_name: z.string().min(1),
  email: z.string().email("Invalid email format"),
  phone_num: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format"),
  repayment_period: z.string(),
});

type LoanFormProps = {
  onSuccess?: (data: any) => void; // Optional callback when form is successfully submitted
};

export const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loan_amount: 5000,
    },
  });

  // Submit handler
  // function onSubmit(values: z.infer<typeof formSchema>) {
  //   try {
  //     console.log(values);
  //     toast(
  //       <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
  //         <code className="text-white">{JSON.stringify(values, null, 2)}</code>
  //       </pre>
  //     );

  //     // If onSuccess callback is provided, call it
  //     if (onSuccess) {
  //       onSuccess(values);
  //     }
  //   } catch (error) {
  //     console.error("Form submission error", error);
  //     toast.error("Failed to submit the form. Please try again.");
  //   }
  // }
  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      fetch("http://localhost:5000/api/apply_loan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // important for session/cookies
        body: JSON.stringify(values),
      })
        .then(async (response) => {
          const data = await response.json();
  
          if (response.ok && data.accepted) {
            toast.success("Loan application submitted successfully!");
            navigate("/api/debug-set-session");
  
            // If onSuccess callback is provided, call it
            if (onSuccess) {
              onSuccess(data);
            }
          } else {
            toast.error(data.message || "Loan submission failed.");
          }
        })
        .catch((error) => {
          console.error("Form submission error", error);
          toast.error("Failed to submit the form. Please try again.");
        });
    } catch (error) {
      console.error("Unexpected error", error);
      toast.error("An unexpected error occurred.");
    }
  }
  
  return (
    <Form {...form}>
        <div className="w-full max-w-4xl mt-6 mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-left">
            Loan Form
          </h2>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 mx-auto py-8"
        >
          {/* Employment Status */}
          <FormField
            control={form.control}
            name="employment_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your employment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* Loan Amount */}
          <FormField
            control={form.control}
            name="loan_amount"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Price - ₱{value}</FormLabel>
                <FormControl>
                  <Slider
                    min={5000}
                    max={50000}
                    step={500}
                    value={[value]} // Set the slider value as an array with one element
                    onValueChange={(vals) => {
                      onChange(vals[0]); // Update form value with the selected slider value
                    }}
                  />
                </FormControl>
                <FormDescription>Adjust the amount by sliding.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Loan Purpose */}
          <FormField
            control={form.control}
            name="loan_purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Purpose</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select the loan purpose" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Business Capital">
                      Business Capital
                    </SelectItem>
                    <SelectItem value="Medical Expenses">
                      Medical Expenses
                    </SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Debt Consolidation">
                      Debt Consolidation
                    </SelectItem>
                    <SelectItem value="Home Improvement">
                      Home Improvement
                    </SelectItem>
                    <SelectItem value="Emergency Funds">
                      Emergency Funds
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthly_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Revenue</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter the monthly revenue"
                    type="number"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="credit_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Score</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter the credit score"
                    type="number"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your last name"
                        type=""
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your first name"
                        type=""
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your middle name"
                        type=""
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email address"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_num"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    {...field}
                    defaultCountry="PH"
                    placeholder="Enter your phone number"
                    onBlur={field.onBlur}
                    onChange={(value) => field.onChange(value || "")}
                    className={
                      form.formState.errors.phone_num ? "border-red-500" : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repayment_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repayment Period</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a repayment period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                    <SelectItem value="36">36 Months</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the period over which you plan to repay the loan.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit">Submit</Button>
        </form>
        </div>
    </Form>
 
  );
};
