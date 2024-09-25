import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import React, { useCallback, useMemo, useState } from 'react';
import { Field } from 'components/uikit/Field';
import { HookFormDropDownInput } from 'components/uikit/inputs/dropdown/HookFormDropDownInput';
import { HookFormMultiSelectDropDownInput } from 'components/uikit/inputs/dropdown/HookFormMultiSelectDropDownInput';
import { Button, ButtonColor } from 'components/uikit/buttons/Button';
import { HookFormDatePicker } from 'components/uikit/inputs/date-time/HookFormDatePicker';
import { Input } from 'components/uikit/inputs/Input';
import { HookFormTimePicker } from 'components/uikit/inputs/date-time/HookFormTimePicker';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import { Links } from 'application/constants/links';
import { AppLink } from 'components/uikit/buttons/AppLink';
import { ProductType } from 'services/api/api-client';
import { useScopedTranslation } from 'application/localization/useScopedTranslation';

import styles from './UiKitPage.module.scss';
import { useModal } from '../../../components/uikit/modal/useModal';
import { PopperExample } from './components/PopperExample';
import { MultiSelectDropDownInput } from 'components/uikit/inputs/dropdown/MultiSelectDropDownInput';
import { HookFormComboBoxInput } from '../../../components/uikit/inputs/dropdown/HookFormComboBoxInput';
import { TimePicker } from 'components/uikit/inputs/date-time/TimePicker';
import { DropDownInput } from 'components/uikit/inputs/dropdown/DropDownInput';

type UiKitForm = {
  dropDown: ProductType;
  multiSelectDropDown: ProductType[];
  combo: string | ProductType;
  timeInMilliseconds: number;
  date: Date;
  input: string;
  password: string;
  category: ProductType;
};

const categories: { title: string; id: ProductType }[] = [
  { title: 'Auto description', id: ProductType.Auto },
  { title: 'Electronic description', id: ProductType.Electronic },
];
for (let i = 0; i < 100; i++)
  categories.push({
    title: '00000000000000000 000000000000 0000000000000000000 ' + i,
    id: (i + 10) as any,
  });

export const UiKitPage: React.FC = () => {
  const i18n = useScopedTranslation('Page.uikit');
  const form = useAdvancedForm<UiKitForm>(async (data) => {
    console.log(data);
    alert(JSON.stringify(data));
  });
  const options = useMemo(() => {
    return [ProductType.Auto, ProductType.Electronic, ProductType.Other];
  }, []);
  const modals = useModal();
  const [multiValues, setMultiValues] = useState<ProductType[]>([]);
  const [complexDropDownValue, setComplexDropDownValue] =
    useState<ProductType | null>(null);
  return (
    <div>
      <AppLink
        color={ButtonColor.Primary}
        to={Links.Authorized.Products.link()}
      >
        Back
      </AppLink>
      <form onSubmit={form.handleSubmitDefault} className={styles.main}>
        <Field
          title={i18n.t('input')}
          hint={'Some hint'}
          linkProps={{
            title: 'Add something',
          }}
        >
          <Input
            {...form.register('input', requiredRule())}
            errorText={form.formState.errors.input?.message}
          />
        </Field>
        <Field title={i18n.t('password')}>
          <Input
            {...form.register('password', requiredRule())}
            type={'password'}
            variant={'formInput'}
            errorText={form.formState.errors.input?.message}
          />
        </Field>
        <Field title={i18n.t('dropdown')}>
          <HookFormDropDownInput
            options={options}
            enableSearch={true}
            customOptions={[
              {
                label: 'Add new',
                onClick: () => {
                  alert('Adding new ProductType is not implemented');
                },
              },
            ]}
            name={'dropDown'}
            control={form.control}
          />
        </Field>
        <Field title={i18n.t('hook_form_dropdown_complex_option')}>
          <HookFormDropDownInput
            enableSearch={true}
            options={categories}
            useVirtualization={true}
            popupWidth={'autosize'}
            name={'category'}
            getOptionLabel={'title'}
            idFunction={(x) => x?.id}
            control={form.control}
          />
          <DropDownInput
            required={false}
            disableAutomaticResetAfterOnValueChanged={true}
            enableSearch={true}
            options={categories}
            useVirtualization={true}
            popupWidth={'autosize'}
            getOptionLabel={'title'}
            idFunction={(x) => x?.id}
            useIdFunctionAsValue={true}
            value={complexDropDownValue}
            onValueChanged={(o) => setComplexDropDownValue(o?.id ?? null)}
          />
        </Field>
        <Field title={i18n.t('multi_select_dropdown')}>
          <HookFormMultiSelectDropDownInput
            options={options}
            name={'multiSelectDropDown'}
            control={form.control}
            hasSearchFilter={true}
          />
        </Field>
        <Field title="Non-hook-form">
          <MultiSelectDropDownInput
            options={options}
            hasSearchFilter={true}
            value={multiValues}
            variant={'formInput'}
            headerTitle={'Test'}
            onValueChanged={(newValues) => setMultiValues(newValues as any)}
          />
        </Field>
        <Field title="Combo">
          <HookFormComboBoxInput
            name={'combo'}
            control={form.control}
            options={options}
            variant={'formInput'}
          />
        </Field>
        <Field title={i18n.t('date')}>
          <HookFormDatePicker name={'date'} control={form.control} />
        </Field>
        <Field title={i18n.t('time')}>
          <HookFormTimePicker
            name={'timeInMilliseconds'}
            control={form.control}
          />
        </Field>
        <Field title={i18n.t('time')}>
          <TimePicker timeInMills={120000} />
        </Field>
        <Button type={'submit'} title={i18n.t('submit_button_title')} />
      </form>
      <Button
        color={ButtonColor.Primary}
        onClick={async () => {
          const result = await modals.showAlert({
            text: 'zxc',
            title: 'qwe',
          });
          alert(result);
        }}
        title={'Show alert'}
      ></Button>
      <Button
        color={ButtonColor.Primary}
        onClick={async () => {
          const result = await modals.showConfirm({
            text: 'zxc',
            title: 'qwe',
          });
          alert(result);
        }}
        title={'Show confirm'}
      ></Button>
      <Button
        color={ButtonColor.Secondary}
        onClick={async () => {
          const result = await modals.showPrompt({
            text: 'zxc',
            title: 'qwe',
            defaultValue: '',
            fieldName: 'Project Name',
          });
          alert(result);
        }}
        title={'Show prompt'}
      ></Button>
      <Button
        color={ButtonColor.Secondary}
        onClick={async () => {
          const result = await modals.showCustom<string>({
            title: 'asd',
            Component: (props) => {
              return (
                <>
                  <div>enter some value</div>
                  <Input
                    value={props.value ?? ''}
                    onChange={(e) => props.setValue(e.target.value)}
                  />
                </>
              );
            },
          });
          alert(result);
        }}
        title={'Show custom'}
      ></Button>
      <PopperExample />
    </div>
  );
};
