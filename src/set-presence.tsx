import { Action, ActionPanel, Form, Icon, Toast, showToast } from "@raycast/api";
import { useState } from "react";
import { setPresence } from "./lib/api";
import { usePreferencesCheck } from "./lib/usePreferencesCheck";

type Values = {
  instanceName: string;
  presence: "available" | "unavailable";
};

export default function Command() {
  const { isValid, isChecking } = usePreferencesCheck();
  const [isLoading, setIsLoading] = useState(false);

  if (isChecking) return <Form isLoading={true} />;
  if (!isValid) return <Form isLoading={false} />;

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    try {
      await setPresence(values.instanceName, values.presence);
      await showToast({ style: Toast.Style.Success, title: `Presence set to: ${values.presence}` });
    } catch (e) {
      const message = (e as { message?: string })?.message || "Failed to set presence";
      await showToast({ style: Toast.Style.Failure, title: "Error", message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      navigationTitle="Set Presence"
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Set" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="instanceName" title="Instance Name" placeholder="e.g. my-business" autoFocus />
      <Form.Dropdown id="presence" title="Presence" defaultValue="available">
        <Form.Dropdown.Item value="available" title="Available" />
        <Form.Dropdown.Item value="unavailable" title="Unavailable" />
      </Form.Dropdown>
    </Form>
  );
}
