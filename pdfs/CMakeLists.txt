cmake_minimum_required(VERSION 3.10)
set(CMAKE_CXX_STANDARD 17)
project(pdfs)

set(PDFS_SOURCES
    src/cmd_page.cc
    src/cmd_preview.cc
    src/cmd_render.cc
    src/cmd_section.cc
    src/cmd_text.cc
    src/document.cc
    src/image_info_dev.cc
    src/main.cc
    src/text_output_dev.cc
)

add_executable(${PROJECT_NAME}
    ${PDFS_SOURCES}
)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_SOURCE_DIR}/poppler-debug/poppler
    ${CMAKE_SOURCE_DIR}/poppler-0.90.1/poppler
    ${CMAKE_SOURCE_DIR}/poppler-0.90.1
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    debug ${CMAKE_SOURCE_DIR}/poppler-debug/libpoppler.dylib
    debug ${CMAKE_SOURCE_DIR}/poppler-debug/cpp/libpoppler-cpp.dylib
)
