import { Action, ActionPanel, Clipboard, Form, Icon, Toast, showToast } from "@raycast/api";
import { useState } from "react";
import { checkWhatsAppNumbers } from "./lib/api";
import { usePreferencesCheck } from "./lib/usePreferencesCheck";

type Values = {
  instanceName: string;
  numbers: string;
};

export default function Command() {
  const { isValid, isChecking } = usePreferencesCheck();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  if (isChecking) return <Form isLoading={true} />;
  if (!isValid) return <Form isLoading={false} />;

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    setResult("");
    try {
      const nums = values.numbers
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      const response = await checkWhatsAppNumbers(values.instanceName, nums);
      const formatted = JSON.stringify(response, null, 2);
      setResult(formatted);
      await showToast({ style: Toast.Style.Success, title: "Check complete" });
    } catch (e) {
      const message = (e as { message?: string })?.message || "Failed to check numbers";
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      navigationTitle="Check WhatsApp Numbers"
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Check" icon={Icon.MagnifyingGlass} onSubmit={handleSubmit} />
          {result ? (
            <Action
              title="Copy Result"
              icon={Icon.Clipboard}
              onAction={() => Clipboard.copy(result)}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          ) : null}
        </ActionPanel>
      }
    >
      <Form.TextField id="instanceName" title="Instance Name" placeholder="e.g. my-business" autoFocus />
      <Form.TextArea id="numbers" title="Numbers" placeholder="One per line or comma-separated" />
      {result ? <Form.TextArea id="result" title="Result (JSON)" value={result} enableMarkdown={false} /> : null}
    </Form>
  );
}
