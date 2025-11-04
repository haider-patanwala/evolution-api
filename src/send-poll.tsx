import { Action, ActionPanel, Form, Icon, Toast, showToast } from "@raycast/api";
import { useState } from "react";
import { sendPoll } from "./lib/api";
import { usePreferencesCheck } from "./lib/usePreferencesCheck";

type Values = {
  instanceName: string;
  number: string;
  name: string;
  selectableCount: string;
  values: string;
};

export default function Command() {
  const { isValid, isChecking } = usePreferencesCheck();
  const [isLoading, setIsLoading] = useState(false);

  if (isChecking) return <Form isLoading={true} />;
  if (!isValid) return <Form isLoading={false} />;

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    try {
      const options = values.values
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await sendPoll({
        instanceName: values.instanceName,
        number: values.number,
        name: values.name,
        selectableCount: parseInt(values.selectableCount, 10),
        values: options,
      });
      await showToast({ style: Toast.Style.Success, title: "Poll sent" });
    } catch (e) {
      const message = (e as { message?: string })?.message || "Failed to send poll";
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      navigationTitle="Send Poll"
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send" icon={Icon.Paperplane} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="instanceName" title="Instance Name" placeholder="e.g. my-business" autoFocus />
      <Form.TextField id="number" title="Recipient Number" placeholder="e.g. 55999999999" />
      <Form.TextField id="name" title="Poll Question" placeholder="e.g. What's your favorite color?" />
      <Form.TextField id="selectableCount" title="Selectable Count" placeholder="e.g. 1" defaultValue="1" />
      <Form.TextArea id="values" title="Options (one per line)" placeholder="Option 1\nOption 2\nOption 3" />
    </Form>
  );
}
