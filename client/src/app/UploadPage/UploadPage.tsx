/**
 * this page is for
 * 1. opening an exisitng project (mock, cause we dont have a dedicated user yet implemented)
 * 2. file upload of all image types in a max size
 * 3. split screen prompt
 * persist the prompt in like session storage
 * add button the clear propmt,
 * we do not save chat history somewhere each is prompt is alone for now
 */

import { UploadComponent } from "./UploadComponent/UploadComponent";
import { UserPromptComponent } from "./UserPromptComponent/UserPromptComponent";

export default function UploadPage() {
  return (
    <section>
      <h1>This is Upload Page</h1>
      <div className="flex flex-col gap-4">
        <UploadComponent />
        <UserPromptComponent />
      </div>
    </section>
  );
}
