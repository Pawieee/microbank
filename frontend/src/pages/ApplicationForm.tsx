"use client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { differenceInYears } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";

const formSchema = z.object({
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().min(1),
  gender: z.string(),
  dateOfBirth: z.coerce.date().refine(
    (date) => {
      return differenceInYears(new Date(), date) >= 18;
    },
    { message: "You must be at least 18 years old." }
  ),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format"),
  email: z.string().email("Invalid email format"),
  address: z.string().min(1),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  zipPostalCode: z.string().min(1),
  employmentStatus: z.string(),
  employeerName: z.string().min(1),
  jobTitle: z.string().min(1),
  monthlyIncome: z.coerce.number().min(5000).max(50000),
  loanAmount: z.coerce.number().min(0),
  loanPurpose: z.string(),
  loanTerm: z.string(),
  existingLoans: z.string(),
  outstandingLoanAmount: z.coerce.number(),
  monthlyExpenses: z.coerce.number(),
  referenceName: z.string().min(1),
  referenceContactNumber: z.string(),
  referenceRelationship: z.string().min(1),
  termsAndConditions: z.unknown(),
});

export default function MyForm() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // Track login state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateOfBirth: new Date(),
    },
  });

  // Add useEffect to check if the user is logged in
  React.useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/appform", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          console.log(data.message);
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsLoggedIn(false);
        navigate("/");
      }
    };

    checkLoginStatus();
  }, [navigate]);

  if (isLoggedIn === null) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return null;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const formattedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth
          ? format(values.dateOfBirth, "yyyy-MM-dd")
          : null,
      };

      const response = await fetch("http://localhost:5000/api/appform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formattedValues),
      });

      const data = await response.json();

      if (response.ok && data.accepted) {
        toast.success("Application submitted successfully!");
        navigate("/dashboard");
      } else if (!response.ok && data.message === "User not logged in") {
        toast.error("You must be logged in to apply.");
        navigate("/");
      } else {
        toast.error(data.message || "Form submission failed.");
      }
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
            Application Form
          </h2>
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-3xl mx-auto py-10"
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="lastName"
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
                name="firstName"
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
                name="middleName"
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

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <DatePicker
                      startYear={1920} // Optional customization
                      endYear={new Date().getFullYear()}
                      selected={field.value}
                      onSelect={field.onChange}
                    />
                    <FormDescription>
                      Your date of birth is used to calculate your age.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6 w-full">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                        <SelectItem value="Prefer not to say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>

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
              <FormItem className="flex flex-col items-start">
                <FormLabel>Phone Number</FormLabel>
                <FormControl className="w-full">
                  <PhoneInput
                    placeholder="Enter your phone number"
                    {...field}
                    defaultCountry="TR"
                    onChange={(value) => field.onChange(value || "")}
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
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your address" type="" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your city" type="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="stateProvince"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your state / province"
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
                name="zipPostalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip / Postal Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your zip / postal code"
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
            name="employmentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Enter your employment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-Employed">Self-Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employeer Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your employeer name"
                    type=""
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your job title"
                    type=""
                    {...field}
                  />
                </FormControl>

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
                    placeholder="Enter your monthly income"
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
            name="loanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Amount Requested</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your loan amount requested"
                    type="number"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
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
                        <SelectTrigger>
                          <SelectValue placeholder="Enter your loan purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="m@example.com">
                          m@example.com
                        </SelectItem>
                        <SelectItem value="m@google.com">
                          m@google.com
                        </SelectItem>
                        <SelectItem value="m@support.com">
                          m@support.com
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="loanTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Term</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Enter your loan term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="existingLoans"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Existing Loans</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-1"
                  >
                    {[
                      ["Male", "male"],
                      ["Female", "female"],
                      ["Other", "other"],
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

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <FormField
                control={form.control}
                name="outstandingLoanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outstanding Loan Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your outstanding loan amount"
                        type="number"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="monthlyExpenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Expenses</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your monthly expenses"
                        type="number"
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
            name="referenceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your reference name"
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
            name="referenceContactNumber"
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <FormLabel>Reference Contact Number</FormLabel>
                <FormControl className="w-full">
                  <PhoneInput
                    placeholder="Enter your reference contact number"
                    {...field}
                    defaultCountry="TR"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceRelationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your relationship with the reference"
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
            name="termsAndConditions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={
                      field.value === true || field.value === false
                        ? field.value
                        : undefined
                    } // Type guard here
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    By checking this box, I confirm that I have read and agree
                    to the Terms and Conditions of this loan application.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </div>
    </Form>
  );
}
