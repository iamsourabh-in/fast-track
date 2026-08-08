import { Page } from 'playwright';

export interface FormFieldDescriptor {
  id: string;
  selector: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  options?: string[]; // For select dropdowns or radio choices
  currentValue?: string;
  required: boolean;
}

export class FormParser {
  /**
   * Scans page and returns all detected form input fields.
   */
  public static async extractFormFields(page: Page): Promise<FormFieldDescriptor[]> {
    return page.evaluate(() => {
      const fields: FormFieldDescriptor[] = [];
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));

      inputs.forEach((el, idx) => {
        const elem = el as HTMLElement;
        const tagName = elem.tagName.toLowerCase();
        const inputType = (elem.getAttribute('type') || 'text').toLowerCase();

        // Skip hidden, submit, button inputs
        if (['hidden', 'submit', 'button', 'image', 'reset'].includes(inputType)) return;

        let fieldType: FormFieldDescriptor['type'] = 'text';
        if (tagName === 'textarea') fieldType = 'textarea';
        else if (tagName === 'select') fieldType = 'select';
        else if (inputType === 'radio') fieldType = 'radio';
        else if (inputType === 'checkbox') fieldType = 'checkbox';
        else if (inputType === 'file') fieldType = 'file';

        // Extract associated label text
        let labelText = '';
        const id = elem.getAttribute('id');
        if (id) {
          const labelEl = document.querySelector(`label[for="${id}"]`);
          if (labelEl) labelText = labelEl.textContent || '';
        }
        if (!labelText) {
          const parentLabel = elem.closest('label');
          if (parentLabel) labelText = parentLabel.textContent || '';
        }
        if (!labelText) {
          labelText = elem.getAttribute('aria-label') || elem.getAttribute('placeholder') || elem.getAttribute('name') || `Field ${idx + 1}`;
        }

        labelText = labelText.replace(/\*/g, '').trim();

        // Extract select/radio options
        let options: string[] | undefined;
        if (tagName === 'select') {
          options = Array.from((elem as HTMLSelectElement).options).map((opt) => opt.text.trim());
        }

        const selector = id ? `#${id}` : elem.getAttribute('name') ? `[name="${elem.getAttribute('name')}"]` : `${tagName}:nth-of-type(${idx + 1})`;

        fields.push({
          id: id || `field_${idx}`,
          selector,
          type: fieldType,
          label: labelText,
          placeholder: elem.getAttribute('placeholder') || undefined,
          options,
          required: elem.hasAttribute('required') || elem.getAttribute('aria-required') === 'true',
        });
      });

      return fields;
    });
  }

  /**
   * Detects application submit or next page button selector.
   */
  public static async findSubmitButtonSelector(page: Page): Promise<string | null> {
    const selector = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn'));
      for (const btn of buttons) {
        const text = (btn.textContent || btn.getAttribute('value') || '').toLowerCase();
        if (
          text.includes('submit') ||
          text.includes('apply') ||
          text.includes('send application') ||
          text.includes('next') ||
          text.includes('continue')
        ) {
          const id = btn.getAttribute('id');
          if (id) return `#${id}`;
          const name = btn.getAttribute('name');
          if (name) return `[name="${name}"]`;
          return 'button[type="submit"], input[type="submit"]';
        }
      }
      return null;
    });

    return selector;
  }
}
