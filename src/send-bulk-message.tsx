import { Action, ActionPanel, Clipboard, Form, Icon, Toast, showToast } from "@raycast/api";
import { useCallback, useRef, useState } from "react";
import { sendTextMessage } from "./lib/api";
import { usePreferencesCheck } from "./lib/usePreferencesCheck";

type Values = {
  instanceName: string;
  numbers: string; // comma or newline separated
  text: string;
  delayMs?: string;
};

export default function Command() {
  const { isValid, isChecking } = usePreferencesCheck();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string>("");
  const isProcessingRef = useRef(false);

  const handleSubmit = useCallback(async (values: Values) => {
    // Prevent multiple simultaneous submissions
    if (isProcessingRef.current) {
      console.log("Already processing, ignoring duplicate submission");
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);

    try {
      const delay = Math.max(0, Number(values.delayMs ?? 0));
      const numbers = values.numbers
        .split(/\n|,/) // split by newline or comma
        .map((s) => s.trim())
        .filter(Boolean);

      if (numbers.length === 0) {
        await showToast({ style: Toast.Style.Failure, title: "No numbers provided" });
        return;
      }

      const lines: string[] = [];
      let success = 0;
      let failed = 0;

      for (let i = 0; i < numbers.length; i++) {
        const num = numbers[i];
        try {
          await sendTextMessage({ instanceName: values.instanceName, number: num, text: values.text });
          success += 1;
          lines.push(`${num},OK`);
          console.log(`Message ${i + 1}/${numbers.length} sent to ${num}`);
        } catch (e) {
          failed += 1;
          const msg = (e as { message?: string })?.message || "ERROR";
          lines.push(`${num},ERROR,${msg.replaceAll(",", " ")}`);
          console.log(`Message ${i + 1}/${numbers.length} failed for ${num}: ${msg}`);
        }
        if (delay > 0 && i < numbers.length - 1) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      const summary = `Sent: ${success}, Failed: ${failed}, Total: ${numbers.length}`;
      setReport(["number,status,message", ...lines, "", summary].join("\n"));
      await showToast({ style: failed > 0 ? Toast.Style.Failure : Toast.Style.Success, title: summary });
    } catch (e) {
      const message = (e as { message?: string })?.message || "Bulk send failed";
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  }, []);

  if (isChecking) {
    return <Form isLoading={true} />;
  }

  if (!isValid) {
    return <Form isLoading={false} />;
  }

  return (
    <Form
      navigationTitle="Send Bulk WhatsApp Messages"
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send Bulk" icon={Icon.Airplane} onSubmit={handleSubmit} />
          {report ? (
            <Action
              title="Copy Report to Clipboard"
              icon={Icon.Clipboard}
              onAction={() => Clipboard.copy(report)}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          ) : null}
        </ActionPanel>
      }
    >
      <Form.TextField id="instanceName" title="Instance Name" placeholder="e.g. my-business" autoFocus />
      <Form.TextArea id="numbers" title="Numbers" placeholder="One per line or comma-separated" />
      <Form.TextArea id="text" title="Message" placeholder="Type your message" />
      <Form.TextField id="delayMs" title="Delay (ms) between messages" placeholder="e.g. 800" />
      {report ? <Form.TextArea id="report" title="Report" value={report} enableMarkdown={false} /> : null}
    </Form>
  );
}
