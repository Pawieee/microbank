import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface LoanStatusEmailProps {
  applicantName?: string;
  status: "approved" | "rejected";
  loanAmount: string;
  date: string;
  referenceId: string;
  supportEmail?: string;
}

export const LoanStatusEmail = ({
  applicantName,
  status,
  loanAmount,
  date,
  referenceId,
  supportEmail = "support@microbank.com",
}: LoanStatusEmailProps) => {
  const previewText = `Loan application ${status === "approved" ? "approved" : "rejected"} - Reference #${referenceId}`;

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white font-sans">
          <Preview>{previewText}</Preview>
          <Container className="border border-solid border-gray-200 rounded my-10 mx-auto p-6 max-w-md">
            <Section className="text-center mb-6">
              <Heading className="text-center text-[20px] font-bold  px-4 py-2 ">
                <span>
                  {/* Inline SVG Logo */}
                  <svg
                    width="50"
                    height="33"
                    viewBox="0 0 115 73"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.806819 0.272725H11.3182L36.0341 60.642H36.8864L61.6023 0.272725H72.1136V73H63.875V17.7443H63.1648L40.4375 73H32.483L9.75568 17.7443H9.04545V73H0.806819V0.272725ZM63.7717 73V0.272725H89.1978C94.2641 0.272725 98.4426 1.14867 101.733 2.90057C105.024 4.62879 107.474 6.9607 109.084 9.89631C110.694 12.8082 111.499 16.0398 111.499 19.5909C111.499 22.7159 110.943 25.2964 109.83 27.3324C108.741 29.3684 107.297 30.9782 105.498 32.1619C103.722 33.3456 101.792 34.2216 99.7092 34.7898V35.5C101.935 35.642 104.172 36.4233 106.421 37.8438C108.67 39.2642 110.552 41.3002 112.067 43.9517C113.582 46.6032 114.34 49.8466 114.34 53.6818C114.34 57.3277 113.511 60.6065 111.854 63.5185C110.197 66.4304 107.581 68.7386 104.006 70.4432C100.431 72.1477 95.7792 73 90.0501 73H63.7717ZM72.5785 65.1875H90.0501C95.8029 65.1875 99.8867 64.0748 102.301 61.8494C104.74 59.6004 105.959 56.8778 105.959 53.6818C105.959 51.2197 105.332 48.947 104.077 46.8636C102.822 44.7566 101.035 43.0758 98.7148 41.821C96.3948 40.5426 93.6486 39.9034 90.4762 39.9034H72.5785V65.1875ZM72.5785 32.233H88.9137C91.5652 32.233 93.9563 31.7121 96.087 30.6705C98.2414 29.6288 99.9459 28.161 101.201 26.267C102.479 24.3731 103.118 22.1477 103.118 19.5909C103.118 16.3949 102.006 13.6842 99.7802 11.4588C97.5548 9.20975 94.0273 8.08523 89.1978 8.08523H72.5785V32.233Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <br></br>Microbank
              </Heading>

              <Heading className="text-xl text-black mt-5">
                Loan Application{" "}
                {status === "approved" ? "Approved ✅" : "Rejected ❌"}
              </Heading>
            </Section>

            <Text className="text-black text-sm leading-6">
              Hello <strong>{applicantName}</strong>,
            </Text>
            <Text className="text-black text-sm leading-6">
              We would like to inform you that your loan application with
              reference ID <strong>{referenceId}</strong> has been{" "}
              <strong
                className={
                  status === "approved" ? "text-green-600" : "text-red-600"
                }
              >
                {status}
              </strong>{" "}
              on <strong>{date}</strong>.
            </Text>

            <Text className="text-black text-sm leading-6">
              <strong>Loan Amount:</strong> {loanAmount}
              <br />
              <strong>Status:</strong>{" "}
              {status === "approved" ? "Approved" : "Rejected"}
            </Text>

            {status === "approved" ? (
              <Text className="text-black text-sm leading-6 mt-6">
                Please wait for further communication regarding the disbursement
                process.
              </Text>
            ) : (
              <Text className="text-black text-sm leading-6 mt-4">
                If you have any questions or wish to re-apply, feel free to
                contact our support team.
              </Text>
            )}

            <Hr className="border-t border-gray-200 my-6" />
            <Text className="text-xs text-gray-600">
              This is an automated message from Microbank. If you believe this
              was sent in error or need assistance, please reach out to us at{" "}
              <Link
                href={`mailto:${supportEmail}`}
                className="text-blue-600 no-underline"
              >
                {supportEmail}
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default LoanStatusEmail;
