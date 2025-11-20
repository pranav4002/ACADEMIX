import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { MdNavigateNext } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";

import {
  addCourseDetails,
  editCourseDetails,
  fetchCourseCategories,
} from "../../../../../services/operations/courseDetailsAPI";
import { setCourse, setStep } from "../../../../../slices/courseSlice";
import { COURSE_STATUS } from "../../../../../utils/constants";
import IconBtn from "../../../../common/IconBtn";
import Upload from "../Upload";
import ChipInput from "./ChipInput";
import RequirementsField from "./RequirementField";

export default function CourseInformationForm() {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();

  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { course, editCourse } = useSelector((state) => state.course);

  const [loading, setLoading] = useState(false);
  const [courseCategories, setCourseCategories] = useState([]);

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      const categories = await fetchCourseCategories();
      if (categories.length > 0) {
        setCourseCategories(categories);
      }
      setLoading(false);
    };

    if (editCourse) {
      setValue("courseTitle", course.courseName);
      setValue("courseShortDesc", course.courseDescription);
      setValue("coursePrice", course.price);
      setValue("courseTags", course.tag);
      setValue("courseBenefits", course.whatYouWillLearn);
      setValue("courseCategory", course.category?._id);
      setValue("courseRequirements", course.instructions);
      setValue("courseImage", course.thumbnail);
    }
    getCategories();
  }, []);

  // Submit Handler
  const onSubmit = async (data) => {
    const formData = new FormData();

    if (editCourse) {
      formData.append("courseId", course._id);

      if (data.courseTitle !== course.courseName)
        formData.append("courseName", data.courseTitle);

      if (data.courseShortDesc !== course.courseDescription)
        formData.append("courseDescription", data.courseShortDesc);

      if (data.coursePrice !== course.price)
        formData.append("price", data.coursePrice);

      if (data.courseTags.toString() !== course.tag.toString())
        formData.append("tag", JSON.stringify(data.courseTags));

      if (data.courseBenefits !== course.whatYouWillLearn)
        formData.append("whatYouWillLearn", data.courseBenefits);

      if (data.courseCategory !== course.category?._id)
        formData.append("category", data.courseCategory);

      if (data.courseRequirements.toString() !== course.instructions.toString())
        formData.append("instructions", JSON.stringify(data.courseRequirements));

      // Image update
      if (data.courseImage instanceof File)
        formData.append("thumbnailImage", data.courseImage);

      setLoading(true);
      const result = await editCourseDetails(formData, token);
      setLoading(false);

      if (result) {
        dispatch(setCourse(result));
        dispatch(setStep(2));
      }
      return;
    }

    // NEW COURSE
    formData.append("courseName", data.courseTitle);
    formData.append("courseDescription", data.courseShortDesc);
    formData.append("price", data.coursePrice);
    formData.append("tag", JSON.stringify(data.courseTags));
    formData.append("whatYouWillLearn", data.courseBenefits);
    formData.append("category", data.courseCategory);
    formData.append("instructions", JSON.stringify(data.courseRequirements));
    formData.append("status", COURSE_STATUS.DRAFT);

    // ⛔ MOST IMPORTANT FIX
    if (data.courseImage instanceof File) {
      formData.append("thumbnailImage", data.courseImage);
    } else {
      toast.error("Please upload a valid image file");
      return;
    }

    setLoading(true);
    const result = await addCourseDetails(formData, token);
    setLoading(false);

    if (result) {
      dispatch(setCourse(result));
      dispatch(setStep(2));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-md border border-richblack-700 bg-richblack-800 p-6"
    >
      {/* Title */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5">Course Title *</label>
        <input
          placeholder="Enter Course Title"
          {...register("courseTitle", { required: true })}
          className="form-style"
        />
        {errors.courseTitle && (
          <span className="text-pink-200">Course title is required</span>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col">
        <label className="text-sm text-richblack-5">Course Short Description *</label>
        <textarea
          placeholder="Enter Description"
          {...register("courseShortDesc", { required: true })}
          className="form-style min-h-[130px]"
        />
        {errors.courseShortDesc && (
          <span className="text-pink-200">Course Description is required</span>
        )}
      </div>

      {/* Price */}
      <div className="flex flex-col">
        <label className="text-sm text-richblack-5">Course Price *</label>
        <div className="relative">
          <input
            {...register("coursePrice", { required: true })}
            className="form-style !pl-12"
          />
          <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-richblack-400" />
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5">Course Category *</label>
        <select
          {...register("courseCategory", { required: true })}
          className="form-style"
        >
          <option value="">Choose a Category</option>
          {courseCategories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <ChipInput
        name="courseTags"
        label="Tags"
        register={register}
        setValue={setValue}
        getValues={getValues}
        errors={errors}
        placeholder="Enter tags and press Enter"
      />

      {/* Thumbnail */}
      <Upload
        name="courseImage"
        label="Course Thumbnail"
        register={register}
        setValue={setValue}
        errors={errors}
        editData={editCourse ? course.thumbnail : null}
      />

      {/* Benefits */}
      <div className="flex flex-col">
        <label className="text-sm text-richblack-5">Benefits of the course *</label>
        <textarea
          {...register("courseBenefits", { required: true })}
          className="form-style min-h-[130px]"
        />
      </div>

      {/* Requirements */}
      <RequirementsField
        name="courseRequirements"
        label="Requirements / Instructions"
        register={register}
        setValue={setValue}
        getValues={getValues}
        errors={errors}
      />

      <div className="flex justify-end gap-x-2">
        <IconBtn disabled={loading} text={editCourse ? "Save Changes" : "Next"}>
          <MdNavigateNext />
        </IconBtn>
      </div>
    </form>
  );
}
