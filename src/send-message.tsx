import { Action, ActionPanel, Form, Icon, Toast, showToast } from "@raycast/api";
import { useState } from "react";
import { sendTextMessage } from "./lib/api";
import { usePreferencesCheck } from "./lib/usePreferencesCheck";

type Values = {
  instanceName: string;
  number: string;
  text: string;
};

export default function Command() {
  const { isValid, isChecking } = usePreferencesCheck();
  const [isLoading, setIsLoading] = useState(false);

  if (isChecking) {
    return <Form isLoading={true} />;
  }

  if (!isValid) {
    return <Form isLoading={false} />;
  }

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    try {
      await sendTextMessage({ instanceName: values.instanceName, number: values.number, text: values.text });
      await showToast({ style: Toast.Style.Success, title: "Message sent" });
    } catch (e) {
      const message = (e as { message?: string })?.message || "Failed to send message";
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      navigationTitle="Send WhatsApp Message"
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send" icon={Icon.Paperplane} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="instanceName" title="Instance Name" placeholder="e.g. my-business" autoFocus />
      <Form.TextField id="number" title="Recipient Number" placeholder="e.g. 55999999999" />
      <Form.TextArea id="text" title="Message" placeholder="Type your message" />
    </Form>
  );
}
