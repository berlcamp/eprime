import { useFilter } from '@/context/FilterContext';
import { useSupabase } from '@/context/SupabaseProvider';
import type { PdsPersonalInfomationTypes } from '@/types';
import { logError } from '@/utils/fetchApi';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import TwoColTableLoading from '../Loading/TwoColTableLoading';

export default function PersonalInfo({ userId }: { userId: string }) {
    const { supabase, session } = useSupabase();
    const { setToast } = useFilter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [userData, setUserData] = useState<PdsPersonalInfomationTypes | null>(
        null
    );

    const {
        register,
        formState: { errors },
        reset,
        handleSubmit,
    } = useForm<PdsPersonalInfomationTypes>({
        mode: 'onSubmit',
    });

    const onSubmit = async (formdata: PdsPersonalInfomationTypes) => {
        if (saving) return;

        setSaving(true);

        // Upsert the database to database
        const newData = {
            user_id: userId,
            firstname: formdata.firstname,
            middlename: formdata.middlename,
            lastname: formdata.lastname,
            ext: formdata.ext,
            birthday: formdata.birthday,
            place_of_birth: formdata.place_of_birth,
            gender: formdata.gender,
            civil_status: formdata.civil_status,
            height: formdata.height,
            weight: formdata.weight,
            blood_type: formdata.blood_type,
            citizenship: formdata.citizenship,
            telephone: formdata.telephone,
            mobile_number: formdata.mobile_number,
            residential_house_no: formdata.residential_house_no,
            residential_street: formdata.residential_street,
            residential_subdivision: formdata.residential_subdivision,
            residential_barangay: formdata.residential_barangay,
            residential_city: formdata.residential_city,
            residential_province: formdata.residential_province,
            residential_zip: formdata.residential_zip,
            permanent_house_no: formdata.permanent_house_no,
            permanent_street: formdata.permanent_street,
            permanent_subdivision: formdata.permanent_subdivision,
            permanent_barangay: formdata.permanent_barangay,
            permanent_city: formdata.permanent_city,
            permanent_province: formdata.permanent_province,
            permanent_zip: formdata.permanent_zip,
            gsis_no: formdata.gsis_no,
            pagibig_no: formdata.pagibig_no,
            philhealth_no: formdata.philhealth_no,
            sss_no: formdata.sss_no,
            tin_no: formdata.tin_no,
            agency_employee_no: formdata.agency_employee_no,
        };
        const { error } = await supabase
            .from('hrm_pds')
            .upsert(newData, { onConflict: 'user_id' });

        if (error) {
            void logError(
                'Update Pds Personal Info',
                'hrm_pds',
                JSON.stringify(newData),
                error.message
            );
            setToast(
                'error',
                'Saving failed, please reload the page and try again.'
            );
        } else {
            setToast('success', 'Successfully saved.');
        }

        setSaving(false);
    };

    const fetchData = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('hrm_pds')
            .select()
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

        if (data) {
            setUserData(data);
        }

        if (error) console.log(error.message);

        reset({
            firstname: data ? data.firstname : '',
            middlename: data ? data.middlename : '',
            lastname: data ? data.lastname : '',
            ext: data ? data.ext : '',
            birthday: data ? data.birthday : '',
            place_of_birth: data ? data.place_of_birth : '',
            gender: data ? data.gender : '',
            civil_status: data ? data.civil_status : '',
            height: data ? data.height : '',
            weight: data ? data.weight : '',
            blood_type: data ? data.blood_type : '',
            citizenship: data ? data.citizenship : '',
            telephone: data ? data.telephone : '',
            mobile_number: data ? data.mobile_number : '',
            residential_house_no: data ? data.residential_house_no : '',
            residential_street: data ? data.residential_street : '',
            residential_subdivision: data ? data.residential_subdivision : '',
            residential_barangay: data ? data.residential_barangay : '',
            residential_city: data ? data.residential_city : '',
            residential_province: data ? data.residential_province : '',
            residential_zip: data ? data.residential_zip : '',
            permanent_house_no: data ? data.permanent_house_no : '',
            permanent_street: data ? data.permanent_street : '',
            permanent_subdivision: data ? data.permanent_subdivision : '',
            permanent_barangay: data ? data.permanent_barangay : '',
            permanent_city: data ? data.permanent_city : '',
            permanent_province: data ? data.permanent_province : '',
            permanent_zip: data ? data.permanent_zip : '',
            gsis_no: data ? data.gsis_no : '',
            pagibig_no: data ? data.pagibig_no : '',
            philhealth_no: data ? data.philhealth_no : '',
            sss_no: data ? data.sss_no : '',
            tin_no: data ? data.tin_no : '',
            agency_employee_no: data ? data.agency_employee_no : '',
        });

        setLoading(false);
    };

    useEffect(() => {
        void fetchData();
    }, []);

    return (
        <div className="w-full">
            {loading && <TwoColTableLoading />}
            {!loading && (
                <form onSubmit={handleSubmit(onSubmit)} className="w-full">
                    <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
                        {/* Begin First Column */}
                        <div className="w-full px-4">
                            <div className="flex items-center">
                                <div className="flex-grow bg-gray-300 h-px"></div>
                                <div className="mx-4 my-4 text-gray-500 text-sm">
                                    Personal Information
                                </div>
                                <div className="flex-grow bg-gray-300 h-px"></div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        First Name:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.firstname}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('firstname', {
                                                    required: true,
                                                })}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                            {errors.firstname && (
                                                <div className="app__error_message">
                                                    First Name is required
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Middle Name:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.middlename}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('middlename')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Last Name:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.lastname}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('lastname', {
                                                    required: true,
                                                })}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                            {errors.lastname && (
                                                <div className="app__error_message">
                                                    Last Name is required
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Name Ext:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.ext}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('ext')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Birthday:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.birthday}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('birthday')}
                                                type="date"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Place of Birth:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.place_of_birth}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('place_of_birth')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Gender:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.gender}
                                        </div>
                                    ) : (
                                        <div>
                                            <select
                                                {...register('gender')}
                                                className="app__select_standard"
                                            >
                                                <option value="">Choose</option>
                                                <option value="Male">
                                                    Male
                                                </option>
                                                <option value="Female">
                                                    Female
                                                </option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Civil Status:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.civil_status}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('civil_status')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Height (inches):
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.height}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('height')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Weight (kg):
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.weight}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('weight')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Blood Type:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.blood_type}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('blood_type')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Citizenship:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.citizenship}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('citizenship')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Telephone:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.telephone}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('telephone')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Mobile Number:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.mobile_number}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('mobile_number')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-grow bg-gray-300 h-px"></div>
                                <div className="mx-4 my-4 text-gray-500 text-sm">
                                    Government IDs
                                </div>
                                <div className="flex-grow bg-gray-300 h-px"></div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        GSIS ID No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.gsis_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('gsis_no')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        PAGIBIG ID No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.pagibig_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('pagibig_no')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        PhilHealth ID No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.philhealth_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('philhealth_no')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        SSS ID No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.sss_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('sss_no')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        TIN ID No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.tin_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('tin_no')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Agency Employee No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.agency_employee_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'agency_employee_no'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* End First Column */}
                        {/* Begin Second Column */}
                        <div className="w-full px-4">
                            <div className="flex items-center">
                                <div className="flex-grow bg-gray-300 h-px"></div>
                                <div className="mx-4 my-4 text-gray-500 text-sm">
                                    Residential Address
                                </div>
                                <div className="flex-grow bg-gray-300 h-px"></div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        House No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.residential_house_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'residential_house_no'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Street:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.residential_street}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'residential_street'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Subdivision/Village:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.residential_subdivision}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'residential_subdivision'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Barangay:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.residential_barangay}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'residential_barangay'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        City/Municipality:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.residential_city}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'residential_city'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Province:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.residential_province}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'residential_province'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Zip Code:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.residential_zip}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('residential_zip')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-grow bg-gray-300 h-px"></div>
                                <div className="mx-4 my-4 text-gray-500 text-sm">
                                    Permanent Address
                                </div>
                                <div className="flex-grow bg-gray-300 h-px"></div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        House No:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.permanent_house_no}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'permanent_house_no'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Street:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.permanent_street}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'permanent_street'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Subdivision/Village:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.permanent_subdivision}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'permanent_subdivision'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Barangay:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.permanent_barangay}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'permanent_barangay'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        City/Municipality:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.permanent_city}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('permanent_city')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Province:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.permanent_province}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register(
                                                    'permanent_province'
                                                )}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__form_field_container">
                                <div className="w-full">
                                    <div className="app__label_standard">
                                        Zip Code:
                                    </div>
                                    {userId !== session.user.id ? (
                                        <div className="app__label_value">
                                            {userData?.permanent_zip}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                {...register('permanent_zip')}
                                                type="text"
                                                className="app__input_standard"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* End Second Column */}
                    </div>
                    {userId === session.user.id && (
                        <>
                            <hr className="my-6 mx-4" />
                            <div className="w-full px-4">
                                <div className="app__label_standard">
                                    <label className="flex items-center space-x-1">
                                        <input
                                            {...register('confirmed', {
                                                required: true,
                                            })}
                                            type="checkbox"
                                            className=""
                                        />
                                        <span className="font-normal text-xs">
                                            By checking this box, you
                                            acknowledge that all information is
                                            accurate and up-to-date.
                                        </span>
                                    </label>
                                    {errors.confirmed && (
                                        <div className="app__error_message">
                                            Confirmation is required
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="app__modal_footer_left mx-4 mt-4">
                                <button
                                    type="submit"
                                    className="app__btn_green_sm"
                                >
                                    {saving ? 'Saving..' : 'Save Changes'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            )}
        </div>
    );
}
