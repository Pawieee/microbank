//nanguha pako og questions, form field and im making the form yet, will upload it tomorrow."use client"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  employmentStatus: z.string(),
  loanAmount: z.number().min(5000).max(50000),
  loanPurpose: z.string(),
  loanNeed: z.string(),
  monthlyIncome: z.number().min(7000).max(50000),
  existingLoan: z.string(),
  name_4766359057: z.string(),
  employerOrBusinessName: z.string().min(1),
  guarantor: z.string(),
  assets: z.string(),
});

export default function MyForm() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: 5000,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <div className="relative max-w-7xl mt-10 mx-auto px-6 py-8 border rounded-2xl shadow-md bg-white">
        <div className="absolute left-6 top-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            ← Back
          </button>
        </div>

        <div className="max-w-3xl mx-auto mb-6">
          <h2 className="text-3xl font-bold text-gray-800 text-left">
            Loan Form
          </h2>
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-3xl mx-auto py-10"
        >
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
                      <SelectValue placeholder="Select the loan purpose" />
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
            name="loanNeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Need Time</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select how soon you need the loan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="within_1_week">Within 1 Week</SelectItem>
                    <SelectItem value="within_2_weeks">
                      Within 2 Weeks
                    </SelectItem>
                    <SelectItem value="within_1_month">
                      Within 1 Month
                    </SelectItem>
                    <SelectItem value="no_rush">No Rush</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How soon do you need the loan?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthlyIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Income</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter the monthly income"
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
            name="existingLoan"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Existing Loans or Debts</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-1"
                  >
                    {[
                      ["Yes", "yes"],
                      ["No", "no"],
                    ].map((option, index) => (
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        key={index}
                      >
                        <FormControl>
                          <RadioGroupItem value={option[1]} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {option[0]}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>Do you have any existing loans or debts? (If yes, additional details)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_4766359057"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Previous Loan Application History</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-1"
                  >
                    {[
                      ["Yes", "yes"],
                      ["No", "no"],
                    ].map((option, index) => (
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        key={index}
                      >
                        <FormControl>
                          <RadioGroupItem value={option[1]} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {option[0]}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Have you ever applied for a loan before?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employerOrBusinessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employer / Business Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter the employer / business name"
                    type="text"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guarantor"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Guarantor or Collateral</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-1"
                  >
                    {[
                      ["Yes", "yes"],
                      ["No", "no"],
                    ].map((option, index) => (
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        key={index}
                      >
                        <FormControl>
                          <RadioGroupItem value={option[1]} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {option[0]}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Do you have a guarantor or collateral for this loan? (If yes, provide details)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assets"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Assets</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-1"
                  >
                    {[
                      ["Yes", "yes"],
                      ["No", "no"],
                    ].map((option, index) => (
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        key={index}
                      >
                        <FormControl>
                          <RadioGroupItem value={option[1]} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {option[0]}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Do you have any personal or business assets?
                  (If yes, list them)
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
}
