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


const capitalizeFirstLetter = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

// Updated Zod schema
const formSchema = z.object({
  employmentStatus: z.string(),
  loanAmount: z.coerce.number().min(5000).max(50000),
  loanPurpose: z.string(),
  payment_schedule: z.string(),
  monthlyRevenue: z.coerce.number().min(5000),
  creditScore: z.string().min(1),
  lastName: z.string()
    .min(1, "Last name is required")
    .trim()
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[A-Za-z\s]+$/, "Last name must contain only letters and spaces"),
  firstName: z.string()
    .min(1, "First name is required")
    .trim()
    .max(50, "First name must be less than 50 characters")
    .regex(/^[A-Za-z\s]+$/, "First name must contain only letters and spaces"),
  middleName: z.string()
    .min(1, "Middle name is required")
    .trim()
    .max(50, "Middle name must be less than 50 characters")
    .regex(/^[A-Za-z\s]+$/, "Middle name must contain only letters and spaces"),
  email: z.string().email("Invalid email format"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, "");
        if (digits.startsWith("09")) return digits.length === 11;
        if (digits.startsWith("63")) return digits.length === 12;
        return false;
      },
      {
        message:
          "Phone number must start with '09' (11 digits) or '63' (12 digits).",
      }
    ),
  repaymentPeriod: z.string(),
});


type LoanFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => void; // Optional callback when form is successfully submitted
};

export const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: 5000,
    },
  });

  // Submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );

      // If onSuccess callback is provided, call it
      if (onSuccess) {
        onSuccess(values);
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <div className="w-full mt-6 mx-auto px-10">
        <h2 className="text-3xl font-bold text-gray-800 text-left">
          Loan Form
        </h2>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto py-8"
        >
          {/* Employment Status */}
          <FormField
            control={form.control}
            name="employmentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select employment status" />
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
            name="loanAmount"
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

          <FormField
            control={form.control}
            name="loanPurpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Purpose</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select loan purpose" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="business_capital">
                      Business Capital
                    </SelectItem>
                    <SelectItem value="medical_expenses">
                      Medical Expenses
                    </SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="debt_consolidation">
                      Debt Consolidation
                    </SelectItem>
                    <SelectItem value="home_improvement">
                      Home Improvement
                    </SelectItem>
                    <SelectItem value="emergency_funds">
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
            name="monthlyRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Revenue</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter monthly revenue"
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
            name="creditScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Score</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select credit score" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="poor">Poor (639 or less)</SelectItem>
                    <SelectItem value="fair">Fair (640-679)</SelectItem>
                    <SelectItem value="good">Good (680-719)</SelectItem>
                    <SelectItem value="excellent">Excellent (720+)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_schedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Schedule</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment schedule" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repaymentPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repayment Period</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select repayment period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1_month">1 Month</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="6_months">6 Months</SelectItem>
                    <SelectItem value="12_months">12 Months</SelectItem>
                    <SelectItem value="24_months">24 Months</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the period over which you plan to repay the loan.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter first name"
                        {...field}
                        onChange={(e) => {
                          const formattedValue = e.target.value
                            .split(" ")
                            .map((word) => capitalizeFirstLetter(word))
                            .join(" ");
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter first name"
                        {...field}
                        onChange={(e) => {
                          const formattedValue = e.target.value
                            .split(" ")
                            .map((word) => capitalizeFirstLetter(word))
                            .join(" ");
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Middle Name */}
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter middle name"
                        {...field}
                        onChange={(e) =>
                          field.onChange(capitalizeFirstLetter(e.target.value))
                        }
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
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    {...field}
                    defaultCountry="PH"
                    placeholder="Enter phone number"
                    onBlur={field.onBlur}
                    onChange={(value) => field.onChange(value || "")}
                    className={
                      form.formState.errors.phoneNumber ? "border-red-500" : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-2 text-right">
            <Button type="submit">Submit Application</Button>
          </div>
        </form>
      </div>
    </Form>
  );
};
