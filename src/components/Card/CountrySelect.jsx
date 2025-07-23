import React, { useEffect, useState } from 'react';
import Select, { components } from 'react-select';
import CountryList from 'country-list-with-dial-code-and-flag';

const CountrySelect = ({ onChange, value }) => {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const allCountries = CountryList.getAll()
      .map(item => ({
        ...item.data,
        value: item.data.code,
        label: item.data.name
      }));

    // Move India to top if present
    const indiaIndex = allCountries.findIndex(country => country.code === 'IN');
    if (indiaIndex > -1) {
      const india = allCountries.splice(indiaIndex, 1)[0];
      allCountries.unshift(india);
    }

    setCountries(allCountries);
  }, []);

  // Custom Option Component
  const Option = ({ children, ...props }) => (
    <components.Option {...props}>
      <div className="flex items-center">
        <span className="mr-2">{props.data.flag}</span>
        <span>{props.data.name}</span>
        <span className="ml-2 text-[#8a8a8a]">{props.data.dial_code}</span>
      </div>
    </components.Option>
  );

  // Custom Single Value Component
  const SingleValue = ({ children, ...props }) => (
    <components.SingleValue {...props}>
      <div className="flex items-center">
        <span className="mr-2">{props.data.flag}</span>
        <span>{props.data.name}</span>
        <span className="ml-2 text-[#8a8a8a]">{props.data.dial_code}</span>
      </div>
    </components.SingleValue>
  );

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: '#2a2929',
      border: 'none',
      boxShadow: 'none',
      cursor: 'pointer',
      padding: '2px',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#2a2929',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#3a3939' : '#2a2929',
      cursor: 'pointer',
      color: 'white',
      ':active': {
        backgroundColor: '#3a3939',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: 'white',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'white',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#8a8a8a',
    }),
  };

  return (
    <Select
      options={countries}
      value={value ? countries.find(c => c.code === value.code) : null}
      onChange={onChange}
      components={{
        Option,
        SingleValue,
      }}
      styles={customStyles}
      placeholder="Select/search a country by name or dial code"
      isSearchable={true}
      filterOption={(option, inputValue) => {
        const searchValue = inputValue.toLowerCase();
        return (
          option.data.name.toLowerCase().includes(searchValue) ||
          option.data.dial_code.toLowerCase().includes(searchValue)
        );
      }}
    />
  );
};

export default CountrySelect;