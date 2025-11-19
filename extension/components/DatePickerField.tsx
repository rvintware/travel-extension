import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface DatePickerFieldProps {
  label: string
  selected: Date | null
  onChange: (date: Date | null) => void
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DatePickerField({
  label,
  selected,
  onChange,
  disabled,
  minDate,
  maxDate
}: DatePickerFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
      </label>
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText="Select date"
        popperPlacement="bottom-start"
        popperModifiers={[
          {
            name: 'preventOverflow',
            options: {
              altAxis: true,
              tether: false,
            },
          },
        ]}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  )
}

